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
import { User } from './user.entity';
import { Order } from './order.entity';
import { Payment } from './payment.entity';
import { Location } from './location.entity';
import { Company } from './company.entity';
import { CashRegister } from './cash-register.entity';

export enum MovementType {
  OPENING = 'opening',
  CLOSING = 'closing',
  SALE = 'sale',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  EXPENSE = 'expense',
  ADJUSTMENT = 'adjustment',
}

export enum PaymentMethod {
  CASH = 'cash',
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  VOUCHER = 'voucher',
}

@Entity('cliente_petiscaria_cash_movements')
@Index(['companyId', 'cashRegisterId'])
@Index(['locationId', 'cashRegisterId'])
@Index(['companyId', 'movementType'])
@Index(['locationId', 'movementType'])
@Index(['companyId', 'createdAt'])
@Index(['locationId', 'createdAt'])
@Index(['companyId', 'userId'])
@Index(['locationId', 'userId'])
export class CashMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @Column({ type: 'uuid' })
  cashRegisterId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  movementType: MovementType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  previousBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  newBalance: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod?: PaymentMethod;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ type: 'uuid', nullable: true })
  paymentId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: {
    receiptNumber?: string;
    customerInfo?: any;
    items?: any[];
    taxes?: any;
    customFields?: Record<string, any>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @ManyToOne(() => CashRegister, (cashRegister) => cashRegister.movements)
  @JoinColumn({ name: 'cashRegisterId' })
  cashRegister: CashRegister;
  
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Order, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Payment, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  // Métodos auxiliares
  isOpening(): boolean {
    return this.movementType === MovementType.OPENING;
  }

  isClosing(): boolean {
    return this.movementType === MovementType.CLOSING;
  }

  isSale(): boolean {
    return this.movementType === MovementType.SALE;
  }

  isRefund(): boolean {
    return this.movementType === MovementType.REFUND;
  }

  isExpense(): boolean {
    return this.movementType === MovementType.EXPENSE;
  }

  isAdjustment(): boolean {
    return this.movementType === MovementType.ADJUSTMENT;
  }

  getMovementDescription(): string {
    switch (this.movementType) {
      case MovementType.OPENING:
        return 'Abertura de Caixa';
      case MovementType.CLOSING:
        return 'Fechamento de Caixa';
      case MovementType.SALE:
        return `Venda - ${this.paymentMethod || 'N/A'}`;
      case MovementType.REFUND:
        return 'Reembolso';
      case MovementType.WITHDRAWAL:
        return 'Sangria';
      case MovementType.DEPOSIT:
        return 'Depósito';
      case MovementType.EXPENSE:
        return 'Despesa';
      case MovementType.ADJUSTMENT:
        return 'Ajuste';
      default:
        return 'Movimento';
    }
  }
}

