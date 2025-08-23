import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Payment } from '../../entities/payment.entity';
import { Recipe } from '../../entities/recipe.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { KitchenGateway } from '../kitchen/kitchen.gateway';
import { CreateOrderDto, OrderStatus, OrderChannel } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    private readonly kitchenGateway: KitchenGateway,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, userId: string, companyId: string): Promise<OrderResponseDto> {
    // REGRA DE NEGÓCIO: Baixa de estoque
    for (const item of createOrderDto.orderItems) {
      const recipe = await this.recipeRepository.findOne({ where: { productId: item.productId, companyId } });
      if (recipe && recipe.ingredients) {
        for (const recipeIngredient of recipe.ingredients) {
          const ingredient = await this.ingredientRepository.findOne({ where: { id: recipeIngredient.ingredientId, companyId } });
          if (ingredient) {
            if (ingredient.currentStock < recipeIngredient.quantity * item.quantity) {
              throw new BadRequestException(`Estoque insuficiente para o ingrediente: ${ingredient.name}`);
            }
            ingredient.currentStock -= recipeIngredient.quantity * item.quantity;
            await this.ingredientRepository.save(ingredient);
          }
        }
      }
    }
    
    // Calcular totais
    const subtotal = createOrderDto.orderItems.reduce((total, item) => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const modificationsTotal = item.modifications?.reduce((modTotal, mod) => modTotal + mod.extraPrice, 0) || 0;
      return total + itemSubtotal + modificationsTotal;
    }, 0);

    const discount = createOrderDto.discount || 0;
    const tax = createOrderDto.tax || 0;
    const total = subtotal - discount + tax;

    // Criar o pedido
    const order = this.orderRepository.create({
      ...createOrderDto,
      subtotal,
      total,
      companyId,
      createdBy: userId,
      status: OrderStatus.OPEN,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Criar os itens do pedido
    const orderItems = createOrderDto.orderItems.map(item => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const modificationsTotal = item.modifications?.reduce((modTotal, mod) => modTotal + mod.extraPrice, 0) || 0;
      const totalPrice = itemSubtotal + modificationsTotal - (item.discount || 0) + (item.tax || 0);

      return this.orderItemRepository.create({
        ...item,
        totalPrice,
        orderId: savedOrder.id,
        companyId,
      });
    });

    await this.orderItemRepository.save(orderItems);

    const fullOrder = await this.findOne(savedOrder.id, companyId);

    // Notificar KDS
    this.kitchenGateway.notifyNewOrder(companyId, {
      id: fullOrder.id,
      orderNumber: fullOrder.id,
      tableNumber: fullOrder.table?.number,
      customerName: fullOrder.customer?.name,
      items: fullOrder.orderItems.map(item => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        notes: item.notes,
        status: item.isReady ? 'ready' : 'pending',
        preparationTime: item.preparationTime || 15,
        startTime: item.createdAt,
        endTime: item.readyTime,
      })),
      status: fullOrder.status,
      priority: 'medium',
      estimatedTime: fullOrder.orderItems.reduce((total, item) => total + (item.preparationTime || 15), 0),
      createdAt: fullOrder.createdAt,
      updatedAt: fullOrder.updatedAt,
    });

    // Retornar o pedido completo
    return fullOrder;
  }

  async findAll(query: OrderQueryDto, companyId: string): Promise<{ orders: OrderResponseDto[]; total: number }> {
    const queryBuilder = this.buildQueryBuilder(query, companyId);
    
    const [orders, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const orderResponses = await Promise.all(
      orders.map(order => this.mapOrderToResponse(order))
    );

    return { orders: orderResponses, total };
  }

  async findOne(id: string, companyId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id, companyId },
      relations: ['orderItems', 'createdByUser'],
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return this.mapOrderToResponse(order);
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto, userId: string, companyId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id, companyId },
      relations: ['orderItems'],
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o pedido pode ser modificado
    if (!order.canBeModified()) {
      throw new BadRequestException('Este pedido não pode ser modificado');
    }

    // REGRA DE NEGÓCIO: Não permitir fechar pedido sem pagamento
    if (updateOrderDto.status === OrderStatus.CLOSED) {
      const payments = await this.paymentRepository.find({ where: { orderId: id, companyId } });
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

      if (totalPaid < order.total) {
        throw new BadRequestException('Não é possível fechar o pedido, pois o valor total ainda não foi pago.');
      }
    }

    // REGRA DE NEGÓCIO: Exigir motivo para cancelamento
    if (updateOrderDto.status === OrderStatus.CANCELLED && !updateOrderDto.cancellationReason) {
      throw new BadRequestException('É necessário fornecer um motivo para o cancelamento.');
    }

    // REGRA DE NEGÓCIO: Marcar itens como enviados para a cozinha
    if (updateOrderDto.status === OrderStatus.PREPARING) {
      for (const item of order.orderItems) {
        if (!item.sentToKitchenAt) {
          item.sentToKitchenAt = new Date();
          await this.orderItemRepository.save(item);
        }
      }
    }

    // REGRA DE NEGÓCIO: Não permitir editar itens enviados à cozinha
    if (updateOrderDto.orderItems) {
      for (const updateItem of updateOrderDto.orderItems) {
        // Supondo que o DTO de atualização de item tenha um 'id'
        const existingItem = order.orderItems.find(i => i.id === (updateItem as any).id); 
        if (existingItem && existingItem.sentToKitchenAt) {
          throw new BadRequestException(`O item "${existingItem.productName}" já foi enviado para a cozinha e não pode ser modificado.`);
        }
      }
    }

    // Atualizar campos específicos baseado no status
    if (updateOrderDto.status === OrderStatus.READY && !order.readyTime) {
      updateOrderDto.readyTime = new Date();
    }

    if (updateOrderDto.status === OrderStatus.DELIVERED && !order.deliveredTime) {
      updateOrderDto.deliveredTime = new Date();
    }

    if (updateOrderDto.status === OrderStatus.CLOSED && !order.closedTime) {
      updateOrderDto.closedTime = new Date();
      updateOrderDto.closedBy = userId;
    }

    if (updateOrderDto.status === OrderStatus.CANCELLED && !order.cancelledTime) {
      updateOrderDto.cancelledTime = new Date();
      updateOrderDto.cancelledBy = userId;
    }

    // Atualizar o pedido
    await this.orderRepository.update(id, updateOrderDto);

    // Recalcular totais se necessário
    if (updateOrderDto.orderItems) {
      await this.updateOrderTotals(id);
    }

    const updatedOrder = await this.findOne(id, companyId);

    // Notificar KDS
    if (updatedOrder.status === OrderStatus.CANCELLED) {
      this.kitchenGateway.notifyOrderCancelled(companyId, id);
    } else {
      this.kitchenGateway.notifyOrderUpdate(companyId, {
        id: updatedOrder.id,
        orderNumber: updatedOrder.id,
        tableNumber: updatedOrder.table?.number,
        customerName: updatedOrder.customer?.name,
        items: updatedOrder.orderItems.map(item => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          notes: item.notes,
          status: item.isReady ? 'ready' : 'pending',
          preparationTime: item.preparationTime || 15,
          startTime: item.createdAt,
          endTime: item.readyTime,
        })),
        status: updatedOrder.status,
        priority: 'medium',
        estimatedTime: updatedOrder.orderItems.reduce((total, item) => total + (item.preparationTime || 15), 0),
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt,
      });
    }

    return updatedOrder;
  }

  async deleteOrder(id: string, companyId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id, companyId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (!order.canBeCancelled()) {
      throw new BadRequestException('Este pedido não pode ser excluído');
    }

    // Soft delete - marcar como cancelado
    await this.orderRepository.update(id, {
      status: OrderStatus.CANCELLED,
      cancelledTime: new Date(),
    });

    // Notificar KDS
    this.kitchenGateway.notifyOrderCancelled(companyId, id);
  }

  async updateOrderStatus(id: string, status: OrderStatus, userId: string, companyId: string): Promise<OrderResponseDto> {
    const updateDto: UpdateOrderDto = { status };
    
    if (status === OrderStatus.CLOSED) {
      updateDto.closedBy = userId;
    } else if (status === OrderStatus.CANCELLED) {
      updateDto.cancelledBy = userId;
    }

    return this.updateOrder(id, updateDto, userId, companyId);
  }

  async getOrdersByStatus(status: OrderStatus, companyId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.find({
      where: { status, companyId },
      relations: ['orderItems'],
      order: { createdAt: 'ASC' },
    });

    return Promise.all(orders.map(order => this.mapOrderToResponse(order)));
  }

  async getOrdersByTable(tableId: string, companyId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.find({
      where: { tableId, companyId },
      relations: ['orderItems'],
      order: { createdAt: 'DESC' },
    });

    return Promise.all(orders.map(order => this.mapOrderToResponse(order)));
  }

  private async updateOrderTotals(orderId: string): Promise<void> {
    const orderItems = await this.orderItemRepository.find({
      where: { orderId },
    });

    const subtotal = orderItems.reduce((total, item) => total + item.totalPrice, 0);
    
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (order) {
      const total = subtotal - order.discount + order.tax;
      await this.orderRepository.update(orderId, { subtotal, total });
    }
  }

  private buildQueryBuilder(query: OrderQueryDto, companyId: string): SelectQueryBuilder<Order> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('order.createdByUser', 'createdByUser')
      .where('order.companyId = :companyId', { companyId });

    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.channel) {
      queryBuilder.andWhere('order.channel = :channel', { channel: query.channel });
    }

    if (query.tableId) {
      queryBuilder.andWhere('order.tableId = :tableId', { tableId: query.tableId });
    }

    if (query.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId: query.customerId });
    }

    if (query.createdBy) {
      queryBuilder.andWhere('order.createdBy = :createdBy', { createdBy: query.createdBy });
    }

    if (query.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate: query.endDate });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(order.notes LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // Ordenação
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  private async mapOrderToResponse(order: Order): Promise<OrderResponseDto> {
    return {
      id: order.id,
      status: order.status,
      channel: order.channel,
      notes: order.notes,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
      numberOfPeople: order.numberOfPeople,
      estimatedReadyTime: order.estimatedReadyTime,
      readyTime: order.readyTime,
      deliveredTime: order.deliveredTime,
      closedTime: order.closedTime,
      cancelledTime: order.cancelledTime,
      cancellationReason: order.cancellationReason,
      metadata: order.metadata,
      companyId: order.companyId,
      tableId: order.tableId,
      customerId: order.customerId,
      createdBy: order.createdBy,
      closedBy: order.closedBy,
      cancelledBy: order.cancelledBy,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderItems: order.orderItems?.map(item => ({
        id: item.id,
        productName: item.productName,
        productDescription: item.productDescription,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discount: item.discount,
        tax: item.tax,
        totalPrice: item.totalPrice,
        notes: item.notes,
        specialInstructions: item.specialInstructions,
        isReady: item.isReady,
        readyTime: item.readyTime,
        deliveredTime: item.deliveredTime,
        preparationTime: item.preparationTime,
        modifications: item.modifications,
        metadata: item.metadata,
        productId: item.productId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })) || [],
      table: undefined, // Removido relacionamento table
      customer: undefined, // Removido relacionamento customer
      createdByUser: order.createdByUser ? {
        id: order.createdByUser.id,
        name: order.createdByUser.name,
      } : undefined,
    };
  }
}
