import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from '../../entities/payment.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { Customer } from '../../entities/customer.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto, RefundType } from './dto/refund-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto, companyId: string): Promise<PaymentResponseDto> {
    // Verificar se o pedido existe e pertence à empresa
    const order = await this.orderRepository.findOne({
      where: { id: createPaymentDto.orderId, companyId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o cliente existe (se fornecido)
    if (createPaymentDto.customerId) {
      const customer = await this.customerRepository.findOne({
        where: { id: createPaymentDto.customerId, companyId },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }
    }

    // Verificar se já existe um pagamento para este pedido
    const existingPayment = await this.paymentRepository.findOne({
      where: { orderId: createPaymentDto.orderId, companyId },
    });

    if (existingPayment) {
      throw new ConflictException('Já existe um pagamento para este pedido');
    }

    // Calcular valor líquido
    const netAmount = this.calculateNetAmount(
      createPaymentDto.amount,
      createPaymentDto.fee || 0,
      createPaymentDto.discount || 0,
      createPaymentDto.tax || 0
    );

    // Criar o pagamento
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      companyId,
      netAmount,
      status: PaymentStatus.PENDING,
      installments: createPaymentDto.installments || 1,
    });

    const savedPayment = await this.paymentRepository.save(payment);
    return this.mapPaymentToResponse(savedPayment, order);
  }

  async findAll(query: PaymentQueryDto, companyId: string): Promise<{ payments: PaymentResponseDto[]; total: number }> {
    const queryBuilder = this.buildQueryBuilder(query, companyId);
    
    const [payments, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const paymentResponses = await Promise.all(
      payments.map(async payment => {
        const order = await this.orderRepository.findOne({
          where: { id: payment.orderId },
          select: ['id', 'orderNumber', 'total', 'status'],
        });
        return this.mapPaymentToResponse(payment, order);
      })
    );

    return { payments: paymentResponses, total };
  }

  async findOne(id: string, companyId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id, companyId },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    const order = await this.orderRepository.findOne({
      where: { id: payment.orderId },
      select: ['id', 'orderNumber', 'total', 'status'],
    });

    return this.mapPaymentToResponse(payment, order);
  }

  async findByOrderId(orderId: string, companyId: string): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepository.find({
      where: { orderId, companyId },
      order: { createdAt: 'DESC' },
    });

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      select: ['id', 'orderNumber', 'total', 'status'],
    });

    return Promise.all(payments.map(payment => this.mapPaymentToResponse(payment, order)));
  }

  async updatePayment(id: string, updatePaymentDto: UpdatePaymentDto, companyId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id, companyId },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Não permitir alterações em pagamentos já processados
    if (payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.FAILED) {
      throw new BadRequestException('Não é possível alterar um pagamento já processado');
    }

    // Recalcular valor líquido se os valores foram alterados
    if (updatePaymentDto.amount || updatePaymentDto.fee || updatePaymentDto.discount || updatePaymentDto.tax) {
      const amount = updatePaymentDto.amount ?? payment.amount;
      const fee = updatePaymentDto.fee ?? payment.fee;
      const discount = updatePaymentDto.discount ?? payment.discount;
      const tax = updatePaymentDto.tax ?? payment.tax;
      
      updatePaymentDto.netAmount = this.calculateNetAmount(amount, fee, discount, tax);
    }

    // Atualizar o pagamento
    await this.paymentRepository.update(id, updatePaymentDto);

    // Retornar o pagamento atualizado
    return this.findOne(id, companyId);
  }

  async processPayment(id: string, processPaymentDto: ProcessPaymentDto, companyId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id, companyId },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Apenas pagamentos pendentes podem ser processados');
    }

    // Atualizar status e dados do pagamento
    const updateData: Partial<Payment> = {
      status: PaymentStatus.COMPLETED,
      processedAt: new Date(),
      transactionId: processPaymentDto.transactionId,
      authorizationCode: processPaymentDto.authorizationCode,
      notes: processPaymentDto.notes,
    };

    if (processPaymentDto.fee !== undefined) {
      updateData.fee = processPaymentDto.fee;
      updateData.netAmount = this.calculateNetAmount(
        payment.amount,
        processPaymentDto.fee,
        payment.discount,
        payment.tax
      );
    }

    if (processPaymentDto.gatewayResponse) {
      updateData.metadata = {
        ...payment.metadata,
        gatewayResponse: processPaymentDto.gatewayResponse,
      };
    }

    await this.paymentRepository.update(id, updateData);

    // Atualizar status do pedido para pago
    await this.orderRepository.update(payment.orderId, { 
      status: OrderStatus.CLOSED,
      paidAt: new Date(),
    });

    return this.findOne(id, companyId);
  }

  async cancelPayment(id: string, companyId: string, reason?: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id, companyId },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Apenas pagamentos pendentes podem ser cancelados');
    }

    await this.paymentRepository.update(id, {
      status: PaymentStatus.CANCELLED,
      notes: reason ? `${payment.notes || ''}\nCancelado: ${reason}`.trim() : payment.notes,
    });

    return this.findOne(id, companyId);
  }

  async refundPayment(id: string, refundDto: RefundPaymentDto, companyId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id, companyId },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (!payment.isRefundable()) {
      throw new BadRequestException('Pagamento não pode ser reembolsado');
    }

    const refundAmount = refundDto.refundType === RefundType.FULL 
      ? payment.getRefundableAmount()
      : (refundDto.amount || 0);

    if (refundAmount <= 0 || refundAmount > payment.getRefundableAmount()) {
      throw new BadRequestException('Valor de reembolso inválido');
    }

    const newRefundedAmount = payment.refundedAmount + refundAmount;
    const newStatus = newRefundedAmount >= payment.netAmount 
      ? PaymentStatus.REFUNDED 
      : PaymentStatus.PARTIALLY_REFUNDED;

    await this.paymentRepository.update(id, {
      status: newStatus,
      refundedAmount: newRefundedAmount,
      refundedAt: new Date(),
      refundReason: refundDto.reason,
      notes: `${payment.notes || ''}\nReembolso: ${refundDto.reason || 'Solicitado pelo cliente'}`.trim(),
    });

    return this.findOne(id, companyId);
  }

  async getPaymentStats(companyId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
    cancelled: number;
    refunded: number;
    totalAmount: number;
    totalFees: number;
    totalDiscounts: number;
    totalTaxes: number;
    totalNetAmount: number;
    totalRefunded: number;
    byMethod: Array<{ method: string; count: number; amount: number }>;
    byStatus: Array<{ status: string; count: number; amount: number }>;
  }> {
    const total = await this.paymentRepository.count({ where: { companyId } });
    const pending = await this.paymentRepository.count({ where: { companyId, status: PaymentStatus.PENDING } });
    const completed = await this.paymentRepository.count({ where: { companyId, status: PaymentStatus.COMPLETED } });
    const failed = await this.paymentRepository.count({ where: { companyId, status: PaymentStatus.FAILED } });
    const cancelled = await this.paymentRepository.count({ where: { companyId, status: PaymentStatus.CANCELLED } });
    const refunded = await this.paymentRepository.count({ 
      where: { companyId, status: PaymentStatus.REFUNDED } 
    });

    const amountStats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalAmount')
      .addSelect('SUM(payment.fee)', 'totalFees')
      .addSelect('SUM(payment.discount)', 'totalDiscounts')
      .addSelect('SUM(payment.tax)', 'totalTaxes')
      .addSelect('SUM(payment.netAmount)', 'totalNetAmount')
      .addSelect('SUM(payment.refundedAmount)', 'totalRefunded')
      .where('payment.companyId = :companyId', { companyId })
      .getRawOne();

    const byMethod = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.paymentMethod', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.netAmount)', 'amount')
      .where('payment.companyId = :companyId', { companyId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .groupBy('payment.paymentMethod')
      .getRawMany();

    const byStatus = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.netAmount)', 'amount')
      .where('payment.companyId = :companyId', { companyId })
      .groupBy('payment.status')
      .getRawMany();

    return {
      total,
      pending,
      completed,
      failed,
      cancelled,
      refunded,
      totalAmount: parseFloat(amountStats.totalAmount) || 0,
      totalFees: parseFloat(amountStats.totalFees) || 0,
      totalDiscounts: parseFloat(amountStats.totalDiscounts) || 0,
      totalTaxes: parseFloat(amountStats.totalTaxes) || 0,
      totalNetAmount: parseFloat(amountStats.totalNetAmount) || 0,
      totalRefunded: parseFloat(amountStats.totalRefunded) || 0,
      byMethod: byMethod.map(item => ({
        method: item.method,
        count: parseInt(item.count),
        amount: parseFloat(item.amount) || 0,
      })),
      byStatus: byStatus.map(item => ({
        status: item.status,
        count: parseInt(item.count),
        amount: parseFloat(item.amount) || 0,
      })),
    };
  }

  private calculateNetAmount(amount: number, fee: number, discount: number, tax: number): number {
    return amount - discount + fee + tax;
  }

  private buildQueryBuilder(query: PaymentQueryDto, companyId: string): SelectQueryBuilder<Payment> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.companyId = :companyId', { companyId });

    if (query.search) {
      queryBuilder.andWhere(
        '(payment.transactionId LIKE :search OR payment.authorizationCode LIKE :search OR payment.notes LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.orderId) {
      queryBuilder.andWhere('payment.orderId = :orderId', { orderId: query.orderId });
    }

    if (query.customerId) {
      queryBuilder.andWhere('payment.customerId = :customerId', { customerId: query.customerId });
    }

    if (query.status) {
      queryBuilder.andWhere('payment.status = :status', { status: query.status });
    }

    if (query.paymentMethod) {
      queryBuilder.andWhere('payment.paymentMethod = :paymentMethod', { paymentMethod: query.paymentMethod });
    }

    if (query.paymentType) {
      queryBuilder.andWhere('payment.paymentType = :paymentType', { paymentType: query.paymentType });
    }

    if (query.minAmount) {
      queryBuilder.andWhere('payment.amount >= :minAmount', { minAmount: query.minAmount });
    }

    if (query.maxAmount) {
      queryBuilder.andWhere('payment.amount <= :maxAmount', { maxAmount: query.maxAmount });
    }

    if (query.startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate: query.endDate });
    }

    // Ordenação
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`payment.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  private mapPaymentToResponse(payment: Payment, order?: Order): PaymentResponseDto {
    return {
      id: payment.id,
      companyId: payment.companyId,
      orderId: payment.orderId,
      customerId: payment.customerId,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentType: payment.paymentType,
      amount: payment.amount,
      fee: payment.fee,
      discount: payment.discount,
      tax: payment.tax,
      netAmount: payment.netAmount,
      transactionId: payment.transactionId,
      authorizationCode: payment.authorizationCode,
      pixKey: payment.pixKey,
      pixQrCode: payment.pixQrCode,
      pixExpirationDate: payment.pixExpirationDate,
      cardBrand: payment.cardBrand,
      cardLastDigits: payment.cardLastDigits,
      installmentPlan: payment.installmentPlan,
      installments: payment.installments,
      notes: payment.notes,
      metadata: payment.metadata,
      processedAt: payment.processedAt,
      expiredAt: payment.expiredAt,
      refundedAt: payment.refundedAt,
      refundedAmount: payment.refundedAmount,
      refundReason: payment.refundReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      order: order ? {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
      } : undefined,
      customer: undefined, // TODO: Implementar quando necessário
    };
  }
}



