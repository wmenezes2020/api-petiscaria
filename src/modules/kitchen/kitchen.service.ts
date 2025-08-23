import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Product } from '../../entities/product.entity';
import { Recipe } from '../../entities/recipe.entity';
import { KitchenOrder, KitchenOrderItem } from './kitchen.gateway';
import { UpdateItemStatusDto, KitchenItemStatus } from './dto/update-item-status.dto';
import { UpdateOrderStatusDto, KitchenOrderStatus } from './dto/update-order-status.dto';
import { KitchenQueryDto } from './dto/kitchen-query.dto';
import { OrderStatus } from '../../entities/order.entity';

@Injectable()
export class KitchenService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
  ) {}

  async getActiveKitchenOrders(companyId: string): Promise<KitchenOrder[]> {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['received', 'preparing', 'ready'],
      })
      .orderBy('order.createdAt', 'ASC')
      .getMany();

    return orders.map(order => this.mapOrderToKitchenOrder(order));
  }

  async getKitchenOrders(query: KitchenQueryDto, companyId: string): Promise<{
    orders: KitchenOrder[];
    total: number;
  }> {
    const queryBuilder = this.buildQueryBuilder(query, companyId);
    
    const [orders, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const kitchenOrders = orders.map(order => this.mapOrderToKitchenOrder(order));

    return { orders: kitchenOrders, total };
  }

  async getKitchenOrder(orderId: string, companyId: string): Promise<KitchenOrder> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.id = :orderId', { orderId })
      .andWhere('order.companyId = :companyId', { companyId })
      .getOne();

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return this.mapOrderToKitchenOrder(order);
  }

  async updateOrderItemStatus(
    orderId: string,
    itemId: string,
    status: string,
    notes?: string,
    companyId?: string,
  ): Promise<KitchenOrder> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id: itemId, order: { id: orderId, companyId } },
      relations: ['order'],
    });

    if (!orderItem) {
      throw new NotFoundException('Item do pedido não encontrado');
    }

    // Atualizar status do item
    const updateData: Partial<OrderItem> = {
      status: status as any,
      notes: notes,
    };

    // Atualizar timestamps baseado no status
    if (status === KitchenItemStatus.PREPARING && !orderItem.startTime) {
      updateData.startTime = new Date();
    } else if (status === KitchenItemStatus.READY && !orderItem.endTime) {
      updateData.endTime = new Date();
    }

    await this.orderItemRepository.update(itemId, updateData);

    // Verificar se todos os itens estão prontos
    const allItems = await this.orderItemRepository.find({
      where: { order: { id: orderId } },
    });

    const allReady = allItems.every(item => item.status === KitchenItemStatus.READY);
    if (allReady) {
      await this.orderRepository.update(orderId, { status: OrderStatus.READY });
    }

    // Retornar pedido atualizado
    return this.getKitchenOrder(orderId, companyId || orderItem.order.companyId);
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    notes?: string,
    companyId?: string,
  ): Promise<KitchenOrder> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, companyId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Atualizar status do pedido
    await this.orderRepository.update(orderId, {
      status: status as any,
      notes: notes,
    });

    // Se o pedido foi marcado como servido, atualizar todos os itens
    if (status === KitchenOrderStatus.SERVED) {
      await this.orderItemRepository.update(
        { order: { id: orderId } },
        { status: KitchenItemStatus.SERVED }
      );
    }

    // Retornar pedido atualizado
    return this.getKitchenOrder(orderId, companyId || order.companyId);
  }

  async getKitchenStats(companyId: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    averagePreparationTime: number;
    ordersByStation: Array<{ station: string; count: number }>;
    ordersByPriority: Array<{ priority: string; count: number }>;
  }> {
    const totalOrders = await this.orderRepository.count({
      where: { companyId, status: In([OrderStatus.OPEN, OrderStatus.PREPARING, OrderStatus.READY]) },
    });

    const pendingOrders = await this.orderRepository.count({
      where: { companyId, status: OrderStatus.OPEN },
    });

    const preparingOrders = await this.orderRepository.count({
      where: { companyId, status: OrderStatus.PREPARING },
    });

    const readyOrders = await this.orderRepository.count({
      where: { companyId, status: OrderStatus.READY },
    });

    // Calcular tempo médio de preparação
    const avgTimeResult = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('AVG(TIMESTAMPDIFF(MINUTE, item.startTime, item.endTime))', 'avgTime')
      .where('item.order.companyId = :companyId', { companyId })
      .andWhere('item.startTime IS NOT NULL')
      .andWhere('item.endTime IS NOT NULL')
      .getRawOne();

    const averagePreparationTime = parseFloat(avgTimeResult.avgTime) || 0;

    // Pedidos por estação (baseado no tipo de produto)
    const ordersByStation = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.items', 'items')
      .leftJoin('items.product', 'product')
      .select('product.type', 'station')
      .addSelect('COUNT(DISTINCT order.id)', 'count')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.OPEN, OrderStatus.PREPARING, OrderStatus.READY],
      })
      .groupBy('product.type')
      .getRawMany();

    // Pedidos por prioridade
    const ordersByPriority = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.OPEN, OrderStatus.PREPARING, OrderStatus.READY],
      })
      .groupBy('order.priority')
      .getRawMany();

    return {
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      averagePreparationTime,
      ordersByStation: ordersByStation.map(item => ({
        station: item.station || 'unknown',
        count: parseInt(item.count),
      })),
      ordersByPriority: ordersByPriority.map(item => ({
        priority: item.priority || 'medium',
        count: parseInt(item.count),
      })),
    };
  }

  async getOrdersByStation(station: string, companyId: string): Promise<KitchenOrder[]> {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.OPEN, OrderStatus.PREPARING, OrderStatus.READY],
      })
      .andWhere('product.type = :station', { station })
      .orderBy('order.priority', 'DESC')
      .addOrderBy('order.createdAt', 'ASC')
      .getMany();

    return orders.map(order => this.mapOrderToKitchenOrder(order));
  }

  async getOrdersByPriority(priority: string, companyId: string): Promise<KitchenOrder[]> {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.priority = :priority', { priority })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.OPEN, OrderStatus.PREPARING, OrderStatus.READY],
      })
      .orderBy('order.createdAt', 'ASC')
      .getMany();

    return orders.map(order => this.mapOrderToKitchenOrder(order));
  }

  private buildQueryBuilder(query: KitchenQueryDto, companyId: string): SelectQueryBuilder<Order> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.companyId = :companyId', { companyId });

    if (query.search) {
      queryBuilder.andWhere(
        '(order.orderNumber LIKE :search OR order.customerName LIKE :search OR table.number LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.itemStatus) {
      queryBuilder.andWhere('items.status = :itemStatus', { itemStatus: query.itemStatus });
    }

    if (query.station) {
      queryBuilder.andWhere('product.type = :station', { station: query.station });
    }

    if (query.priority) {
      queryBuilder.andWhere('order.priority = :priority', { priority: query.priority });
    }

    if (query.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate: query.endDate });
    }

    // Ordenação
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  private mapOrderToKitchenOrder(order: Order): KitchenOrder {
    const items: KitchenOrderItem[] = order.items.map(item => ({
      id: item.id,
      productName: item.product.name,
      quantity: item.quantity,
      notes: item.notes,
      status: item.status as KitchenItemStatus,
      preparationTime: item.product.preparationTime || 15,
      startTime: item.startTime,
      endTime: item.endTime,
    }));

    // Calcular tempo estimado total
    const estimatedTime = items.reduce((total, item) => total + item.preparationTime, 0);

    // Determinar prioridade baseada no tempo e tipo de pedido
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (estimatedTime > 45) priority = 'high';
    if (estimatedTime > 60) priority = 'urgent';
    if (estimatedTime < 15) priority = 'low';

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.table?.number,
      customerName: order.customerName,
      items,
      status: order.status,
      priority,
      estimatedTime,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}




