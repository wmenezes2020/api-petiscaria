import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DeepPartial } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../../entities/payment.entity';
import { Recipe } from '../../entities/recipe.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { KitchenGateway } from '../kitchen/kitchen.gateway';
import { CreateOrderDto, OrderStatus, OrderChannel, OrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { CashMovement, MovementType } from '../../entities/cash-movement.entity';
import { CashRegister, CashRegisterStatus } from '../../entities/cash-register.entity';

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
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
    private readonly kitchenGateway: KitchenGateway,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    userId: string,
    companyId: string,
    tenantId: string,
  ): Promise<OrderResponseDto> {
    const orderItems = createOrderDto.orderItems ?? [];

    await this.adjustIngredientStocks(orderItems, companyId, tenantId);

    const subtotal = this.calculateItemsTotal(orderItems);
    const discount = this.ensureNumber(createOrderDto.discount, 0);
    const tax = this.ensureNumber(createOrderDto.tax, 0);
    const total = this.ensureNumber(subtotal - discount + tax, 0);

    // Criar o pedido
    const order = this.orderRepository.create({
      ...createOrderDto,
      subtotal,
      total,
      companyId,
      tenantId,
      createdBy: userId,
      status: OrderStatus.OPEN,
    });

    const savedOrder = await this.orderRepository.save(order);

    const orderItemsEntities = orderItems.map(item => {
      const totalPrice = this.calculateItemTotal(item);
      return this.orderItemRepository.create({
        ...item,
        discount: this.ensureNumber(item.discount, 0),
        tax: this.ensureNumber(item.tax, 0),
        totalPrice,
        orderId: savedOrder.id,
        companyId,
        tenantId,
      });
    });

    await this.orderItemRepository.save(orderItemsEntities);

    const fullOrder = await this.findOne(savedOrder.id, companyId, tenantId);

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

  async findAll(
    query: OrderQueryDto,
    companyId: string,
    tenantId: string,
  ): Promise<{ orders: OrderResponseDto[]; total: number }> {
    const queryBuilder = this.buildQueryBuilder(query, companyId, tenantId);
    
    const [orders, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const orderResponses = await Promise.all(
      orders.map(order => this.mapOrderToResponse(order))
    );

    return { orders: orderResponses, total };
  }

  async findOne(id: string, companyId: string, tenantId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id, companyId, tenantId },
      relations: ['orderItems', 'createdByUser', 'table', 'customer'],
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return this.mapOrderToResponse(order);
  }

  async updateOrder(
    id: string,
    updateOrderDto: UpdateOrderDto,
    userId: string,
    companyId: string,
    tenantId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id, companyId, tenantId },
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
      const payments = await this.paymentRepository.find({
        where: { orderId: id, companyId, tenantId },
      });
      const totalPaid = payments.reduce((sum, payment) => sum + this.ensureNumber(payment.amount, 0), 0);
      const orderTotal = this.ensureNumber(order.total, 0);

      if (totalPaid + 0.005 < orderTotal) {
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

    const updatedOrder = await this.findOne(id, companyId, tenantId);

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

  async deleteOrder(id: string, companyId: string, tenantId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id, companyId, tenantId },
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

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    userId: string,
    companyId: string,
    tenantId: string,
  ): Promise<OrderResponseDto> {
    const updateDto: UpdateOrderDto = { status };
    
    if (status === OrderStatus.CLOSED) {
      updateDto.closedBy = userId;
    } else if (status === OrderStatus.CANCELLED) {
      updateDto.cancelledBy = userId;
    }

    return this.updateOrder(id, updateDto, userId, companyId, tenantId);
  }

  async getOrdersByStatus(status: OrderStatus, companyId: string, tenantId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.find({
      where: { status, companyId, tenantId },
      relations: ['orderItems', 'table', 'customer', 'createdByUser'],
      order: { createdAt: 'ASC' },
    });

    return Promise.all(orders.map(order => this.mapOrderToResponse(order)));
  }

  async getOrdersByTable(tableId: string, companyId: string, tenantId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.find({
      where: { tableId, companyId, tenantId },
      relations: ['orderItems'],
      order: { createdAt: 'DESC' },
    });

    return Promise.all(orders.map(order => this.mapOrderToResponse(order)));
  }

  private async updateOrderTotals(orderId: string): Promise<void> {
    const orderItems = await this.orderItemRepository.find({
      where: { orderId },
    });

    const subtotal = orderItems.reduce((total, item) => total + this.ensureNumber(item.totalPrice, 0), 0);

    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (order) {
      const discount = this.ensureNumber(order.discount, 0);
      const tax = this.ensureNumber(order.tax, 0);
      const total = this.ensureNumber(subtotal - discount + tax, 0);
      await this.orderRepository.update(orderId, { subtotal, total });
    }
  }

  private buildQueryBuilder(
    query: OrderQueryDto,
    companyId: string,
    tenantId: string,
  ): SelectQueryBuilder<Order> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('order.createdByUser', 'createdByUser')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.tenantId = :tenantId', { tenantId });

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

  async splitOrder(id: string, splitData: any, companyId: string, tenantId: string): Promise<OrderResponseDto[]> {
    const originalOrder = await this.orderRepository.findOne({
      where: { id, companyId, tenantId },
      relations: ['orderItems'],
    });

    if (!originalOrder) {
      throw new NotFoundException('Pedido não encontrado');
    }
    
    if (!originalOrder.canBeModified()) {
      throw new BadRequestException('Este pedido não pode ser dividido');
    }

    const newOrder = this.orderRepository.create({
      ...originalOrder,
      id: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      total: splitData.items.reduce((sum, item) => sum + item.totalPrice, 0),
      subtotal: splitData.items.reduce((sum, item) => sum + item.totalPrice, 0) - originalOrder.discount,
      notes: `Pedido dividido de #${originalOrder.id}`,
      tenantId,
    });

    const savedNewOrder = await this.orderRepository.save(newOrder);

    // Copiar itens para o novo pedido
    const newOrderItems = splitData.items.map(item => {
      const originalItem = originalOrder.orderItems.find(oi => oi.id === item.orderItemId);
      return this.orderItemRepository.create({
        ...originalItem,
        id: undefined,
        orderId: savedNewOrder.id,
        quantity: item.quantity,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    await this.orderItemRepository.save(newOrderItems);

    // Notificar KDS
    this.kitchenGateway.notifyNewOrder(companyId, savedNewOrder as any);

    return [
      await this.findOne(id, companyId, tenantId),
      await this.findOne(savedNewOrder.id, companyId, tenantId),
    ];
  }

  async mergeOrders(orderIds: string[], companyId: string, tenantId: string): Promise<OrderResponseDto> {
    if (orderIds.length < 2) {
      throw new BadRequestException('É necessário pelo menos 2 pedidos para junção');
    }

    const orders = await Promise.all(
      orderIds.map(id =>
        this.orderRepository.findOne({ where: { id, companyId, tenantId }, relations: ['orderItems'] }),
      ),
    );

    if (orders.some(order => !order)) {
      throw new NotFoundException('Um ou mais pedidos não foram encontrados');
    }

    if (orders.some(order => !order.canBeModified())) {
      throw new BadRequestException('Um ou mais pedidos não podem ser modificados');
    }

    const [primaryOrder, ...otherOrders] = orders;

    // Consolidar itens criando novos objetos
    const allItems = [...primaryOrder.orderItems];
    otherOrders.forEach(order => {
      order.orderItems.forEach(item => {
        allItems.push(this.orderItemRepository.create({
          ...item,
          id: undefined,
          orderId: primaryOrder.id,
        }) as any);
      });
    });

    // Remover pedidos secundários (soft delete)
    for (const order of otherOrders) {
      await this.orderRepository.update(order.id, {
        status: OrderStatus.CANCELLED,
        cancelledTime: new Date(),
      });
    }

    // Salvar novos itens
    await this.orderItemRepository.save(allItems.filter((_, index) => index >= primaryOrder.orderItems.length));

    // Recalcular totais do pedido principal
    const newTotal = allItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    await this.orderRepository.update(primaryOrder.id, {
      total: newTotal,
      subtotal: newTotal - primaryOrder.discount,
      notes: `${primaryOrder.notes || ''}\nPedidos juntados: ${orderIds.slice(1).join(', ')}`.trim(),
    });

    // Notificar KDS
    this.kitchenGateway.notifyOrderUpdate(companyId, primaryOrder as any);

    return this.findOne(primaryOrder.id, companyId, tenantId);
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
      table: order.table ? {
        id: order.table.id,
        number: order.table.number,
        name: order.table.name || order.table.number,
      } : undefined,
      customer: order.customer ? {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
      } : undefined,
      createdByUser: order.createdByUser ? {
        id: order.createdByUser.id,
        name: order.createdByUser.name,
      } : undefined,
    };
  }

  async addItemsToOrder(
    orderId: string,
    items: OrderItemDto[],
    companyId: string,
    tenantId: string,
  ): Promise<OrderResponseDto> {
    if (!items || items.length === 0) {
      return this.findOne(orderId, companyId, tenantId);
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId, companyId, tenantId },
      relations: ['orderItems'],
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (!order.canBeModified()) {
      throw new BadRequestException('Este pedido não pode ser modificado');
    }

    await this.adjustIngredientStocks(items, companyId, tenantId);

    const newOrderItems = items.map(item => {
      const totalPrice = this.calculateItemTotal(item);
      return this.orderItemRepository.create({
        ...item,
        discount: item.discount ?? 0,
        tax: item.tax ?? 0,
        totalPrice,
        orderId: order.id,
        companyId,
        tenantId,
      });
    });

    await this.orderItemRepository.save(newOrderItems);

    const additionalSubtotal = this.calculateItemsTotal(items);
    const currentSubtotal = this.ensureNumber(order.subtotal, 0);
    const currentDiscount = this.ensureNumber(order.discount, 0);
    const currentTax = this.ensureNumber(order.tax, 0);

    const subtotal = this.ensureNumber(currentSubtotal + additionalSubtotal, 0);
    const total = this.ensureNumber(subtotal - currentDiscount + currentTax, 0);

    await this.orderRepository.update(order.id, {
      subtotal,
      total,
      updatedAt: new Date(),
    });

    return this.findOne(orderId, companyId, tenantId);
  }

  private async adjustIngredientStocks(items: OrderItemDto[], companyId: string, tenantId: string): Promise<void> {
    if (!items || items.length === 0) {
      return;
    }

    for (const item of items) {
      if (!item.productId) {
        continue;
      }

      const recipe = await this.recipeRepository.findOne({ where: { productId: item.productId, companyId, tenantId } });
      if (recipe && recipe.ingredients) {
        for (const recipeIngredient of recipe.ingredients) {
          const ingredient = await this.ingredientRepository.findOne({ where: { id: recipeIngredient.ingredientId, companyId, tenantId } });
          if (ingredient) {
            const totalRequired = this.ensureNumber(recipeIngredient.quantity, 0) * this.ensureNumber(item.quantity, 0);
            if (ingredient.currentStock < totalRequired) {
              throw new BadRequestException(`Estoque insuficiente para o ingrediente: ${ingredient.name}`);
            }
            ingredient.currentStock -= totalRequired;
            await this.ingredientRepository.save(ingredient);
          }
        }
      }
    }
  }

  private calculateItemsTotal(items: OrderItemDto[]): number {
    return items.reduce((total, item) => total + this.calculateItemTotal(item), 0);
  }

  private calculateItemTotal(item: OrderItemDto): number {
    const unitPrice = this.ensureNumber(item.unitPrice, 0);
    const quantity = this.ensureNumber(item.quantity, 0);
    const itemSubtotal = unitPrice * quantity;
    const modificationsTotal = (item.modifications ?? []).reduce((sum, mod) => sum + this.ensureNumber(mod.extraPrice, 0), 0);
    const discount = this.ensureNumber(item.discount, 0);
    const tax = this.ensureNumber(item.tax, 0);
    return this.ensureNumber(itemSubtotal + modificationsTotal - discount + tax, 0);
  }

  private ensureNumber(value: any, fallback = 0): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : fallback;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  }

  async registerQuickPayment(
    orderId: string,
    companyId: string,
    tenantId: string,
    userId: string,
    paymentMethod?: PaymentMethod,
    paymentAmount?: number,
  ): Promise<Payment | null> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, companyId, tenantId },
      relations: ['orderItems', 'table'],
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const computedItemsTotal = this.calculateItemsTotal(order.orderItems as any);
    const discountValue = this.ensureNumber(order.discount, 0);
    const taxValue = this.ensureNumber(order.tax, 0);
    const computedTotal = this.ensureNumber(
      computedItemsTotal - discountValue + taxValue,
      0,
    );

    let total = this.ensureNumber(order.total, computedTotal);
    if (total <= 0 && computedTotal > 0) {
      total = computedTotal;
    }

    const storedSubtotal = this.ensureNumber(order.subtotal, computedItemsTotal);

    if (
      Math.abs(storedSubtotal - computedItemsTotal) > 0.01 ||
      Math.abs(this.ensureNumber(order.total, 0) - total) > 0.01
    ) {
      await this.orderRepository.update(orderId, {
        subtotal: computedItemsTotal,
        total,
      });
    }

    const paidAmount = await this.getTotalPaid(orderId, companyId, tenantId);

    let outstanding = this.ensureNumber(total - paidAmount, 0);
    if (outstanding <= 0) {
      return null;
    }

    let amountToPay = paymentAmount !== undefined ? this.ensureNumber(paymentAmount, 0) : outstanding;
    if (amountToPay <= 0) {
      return null;
    }

    if (amountToPay > outstanding) {
      amountToPay = outstanding;
    }

    const method = paymentMethod ?? PaymentMethod.CASH;

    const payment = this.paymentRepository.create({
      companyId,
      tenantId,
      orderId,
      customerId: order.customerId ?? undefined,
      amount: amountToPay,
      netAmount: amountToPay,
      discount: 0,
      tax: 0,
      fee: 0,
      paymentMethod: method,
      paymentType: PaymentType.FULL,
      status: PaymentStatus.COMPLETED,
      metadata: {
        customFields: {
          generatedBy: 'quick-payment',
          generatedAt: new Date().toISOString(),
          paymentMethod: method,
          requestedAmount: paymentAmount,
        },
      },
      processedAt: new Date(),
    } as DeepPartial<Payment>);

    const savedPayment = await this.paymentRepository.save(payment);

    const openRegister = await this.cashRegisterRepository.findOne({
      where: { companyId, tenantId, status: CashRegisterStatus.OPEN },
      order: { openedAt: 'DESC' },
    });

    if (openRegister) {
      const lastMovement = await this.cashMovementRepository.findOne({
        where: { companyId, tenantId, cashRegisterId: openRegister.id },
        order: { createdAt: 'DESC' },
      });

      const previousBalance = this.ensureNumber(
        lastMovement?.newBalance ?? lastMovement?.amount ?? openRegister.expectedBalance ?? openRegister.openingBalance,
        this.ensureNumber(openRegister.openingBalance, 0),
      );

      const newBalance = this.ensureNumber(previousBalance + amountToPay, previousBalance);

      const movement = this.cashMovementRepository.create({
        companyId,
        tenantId,
        cashRegisterId: openRegister.id,
        userId,
        movementType: MovementType.SALE,
        amount: amountToPay,
        previousBalance,
        newBalance,
        paymentMethod: method,
        orderId,
        paymentId: savedPayment.id,
        description: order.table?.number
          ? `Pagamento da mesa ${order.table.number}`
          : 'Pagamento rápido de comanda',
        notes: order.notes ?? undefined,
        metadata: {
          customFields: {
            source: 'table-command',
            paymentMethod: method,
            tableId: order.tableId,
          },
        },
      } as DeepPartial<CashMovement>);

      await this.cashMovementRepository.save(movement);

      await this.cashRegisterRepository.update(openRegister.id, {
        expectedBalance: newBalance,
        updatedAt: new Date(),
      });
    }

    return savedPayment;
  }

  private async getTotalPaid(orderId: string, companyId: string, tenantId: string): Promise<number> {
    const payments = await this.paymentRepository.find({
      where: { orderId, companyId, tenantId, status: PaymentStatus.COMPLETED },
    });

    return payments.reduce((sum, payment) => sum + this.ensureNumber(payment.amount, 0), 0);
  }
}
