import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';
import { Location } from './location.entity';
import { Table } from './table.entity';

export enum OrderStatus {
  OPEN = 'open',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum OrderChannel {
  TABLE = 'table',
  COUNTER = 'counter',
  DELIVERY = 'delivery',
  TAKEAWAY = 'takeaway',
}

@Entity('cliente_petiscaria_orders')
@Index(['companyId'])
@Index(['locationId'])
@Index(['status'])
@Index(['tableId'])
@Index(['customerId'])
@Index(['createdBy'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.OPEN
  })
  status: OrderStatus;

  @Column({ 
    type: 'enum',
    enum: OrderChannel,
    default: OrderChannel.TABLE
  })
  channel: OrderChannel;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  orderNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'int', default: 1 })
  numberOfPeople: number;

  @Column({ type: 'timestamp', nullable: true })
  estimatedReadyTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  readyTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancellationReason: string;

  @Column({ type: 'json', nullable: true })
  metadata: {
    source?: string;
    deviceInfo?: string;
    location?: string;
    specialInstructions?: string;
  };

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @Column({ type: 'uuid', nullable: true })
  tableId: string;

  @ManyToOne(() => Table)
  @JoinColumn({ name: 'tableId' })
  table: Table;

  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  closedBy: string;

  @Column({ type: 'uuid', nullable: true })
  cancelledBy: string;

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

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closedBy' })
  closedByUser: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelledBy' })
  cancelledByUser: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items: OrderItem[];

  // Métodos auxiliares
  isOpen(): boolean {
    return this.status === OrderStatus.OPEN;
  }

  isPreparing(): boolean {
    return this.status === OrderStatus.PREPARING;
  }

  isReady(): boolean {
    return this.status === OrderStatus.READY;
  }

  isDelivered(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }

  isClosed(): boolean {
    return this.status === OrderStatus.CLOSED;
  }

  isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }

  canBeModified(): boolean {
    return this.status === OrderStatus.OPEN || this.status === OrderStatus.PREPARING;
  }

  canBeCancelled(): boolean {
    return this.status !== OrderStatus.CLOSED && this.status !== OrderStatus.CANCELLED;
  }

  getTotalItems(): number {
    return this.orderItems?.reduce((total, item) => total + item.quantity, 0) || 0;
  }

  getPreparationTime(): number | null {
    if (!this.readyTime || !this.createdAt) return null;
    return Math.round((this.readyTime.getTime() - this.createdAt.getTime()) / 1000 / 60); // em minutos
  }

  getDeliveryTime(): number | null {
    if (!this.deliveredTime || !this.readyTime) return null;
    return Math.round((this.deliveredTime.getTime() - this.readyTime.getTime()) / 1000 / 60); // em minutos
  }
}
