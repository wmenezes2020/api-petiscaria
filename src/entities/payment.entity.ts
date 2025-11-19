import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Customer } from './customer.entity';
import { Company } from './company.entity';
import { Tenant } from './tenant.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  VOUCHER = 'voucher',
}

export enum PaymentType {
  FULL = 'full',
  PARTIAL = 'partial',
  INSTALLMENT = 'installment',
  ADVANCE = 'advance',
}

@Entity('cliente_petiscaria_payments')
@Index(['tenantId', 'companyId', 'orderId'])
@Index(['tenantId', 'companyId', 'customerId'])
@Index(['tenantId', 'companyId', 'status'])
@Index(['tenantId', 'companyId', 'paymentMethod'])
@Index(['tenantId', 'companyId', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.FULL,
  })
  paymentType: PaymentType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netAmount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  authorizationCode?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pixKey?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pixQrCode?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pixExpirationDate?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cardBrand?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cardLastDigits?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  installmentPlan?: string;

  @Column({ type: 'int', default: 1 })
  installments: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: {
    gatewayResponse?: any;
    customerData?: any;
    deviceInfo?: any;
    location?: any;
    customFields?: Record<string, any>;
    openpixChargeId?: string;
    openpixResponse?: any;
  };

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  refundReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;
  
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
  
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  // Métodos auxiliares
  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  isRefundable(): boolean {
    return this.status === PaymentStatus.COMPLETED && this.netAmount > this.refundedAmount;
  }

  getRefundableAmount(): number {
    return this.netAmount - this.refundedAmount;
  }

  calculateNetAmount(): number {
    return this.amount - this.discount + this.fee + this.tax;
  }
}

