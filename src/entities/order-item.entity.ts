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
import { Product } from './product.entity';

@Entity('cliente_petiscaria_order_items')
@Index(['orderId'])
@Index(['productId'])
@Index(['companyId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'text', nullable: true })
  productDescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  specialInstructions: string;

  @Column({ type: 'boolean', default: false })
  isReady: boolean;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  readyTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredTime: Date;

  @Column({ type: 'int', default: 0 })
  preparationTime: number; // em minutos

  @Column({ type: 'timestamp', nullable: true })
  sentToKitchenAt: Date;

  @Column({ type: 'json', nullable: true })
  modifications: {
    optionId: string;
    optionName: string;
    extraPrice: number;
  }[];

  @Column({ type: 'json', nullable: true })
  metadata: {
    category?: string;
    allergens?: string[];
    dietaryInfo?: string;
    kitchenStation?: string;
  };

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid', nullable: true })
  productId: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Order, (order) => order.orderItems)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Métodos auxiliares
  getSubtotal(): number {
    return this.unitPrice * this.quantity;
  }

  getTotalWithModifications(): number {
    const modificationsTotal = this.modifications?.reduce((total, mod) => total + mod.extraPrice, 0) || 0;
    return this.getSubtotal() + modificationsTotal - this.discount + this.tax;
  }

  isDelivered(): boolean {
    return !!this.deliveredTime;
  }

  getPreparationTimeInMinutes(): number {
    if (!this.readyTime || !this.createdAt) return 0;
    return Math.round((this.readyTime.getTime() - this.createdAt.getTime()) / 1000 / 60);
  }

  getDeliveryTimeInMinutes(): number {
    if (!this.deliveredTime || !this.readyTime) return 0;
    return Math.round((this.deliveredTime.getTime() - this.readyTime.getTime()) / 1000 / 60);
  }

  hasModifications(): boolean {
    return this.modifications && this.modifications.length > 0;
  }

  getModificationsTotal(): number {
    return this.modifications?.reduce((total, mod) => total + mod.extraPrice, 0) || 0;
  }
}



