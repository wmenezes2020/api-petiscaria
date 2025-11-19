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
import { Company } from './company.entity';
import { Product } from './product.entity';
import { Location } from './location.entity';
import { Tenant } from './tenant.entity';

export enum StockMovementType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  LOSS = 'loss',
  RETURN = 'return',
}

export enum StockMovementReason {
  PURCHASE = 'purchase',
  SALE = 'sale',
  CONSUMPTION = 'consumption',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  LOSS = 'loss',
  RETURN = 'return',
  INITIAL_STOCK = 'initial_stock',
  INVENTORY_COUNT = 'inventory_count',
}

@Entity('cliente_petiscaria_stock_movements')
@Index(['tenantId', 'companyId'])
@Index(['tenantId', 'companyId', 'locationId'])
@Index(['tenantId', 'companyId', 'productId'])
@Index(['tenantId', 'companyId', 'type'])
@Index(['tenantId', 'companyId', 'reason'])
@Index(['tenantId', 'companyId', 'date'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ 
    type: 'varchar',
    length: 50,
    comment: 'in, out, adjustment, transfer, loss, return'
  })
  type: string;

  @Column({ 
    type: 'varchar',
    length: 50,
    comment: 'purchase, sale, consumption, adjustment, transfer, loss, return, initial_stock, inventory_count'
  })
  reason: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  quantityBefore: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  quantityAfter: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string; // número do pedido, nota fiscal, etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string; // local de origem/destino para transferências

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  batchNumber: string; // número do lote

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'json', nullable: true })
  metadata: {
    purchaseOrderId?: string;
    invoiceNumber?: string;
    orderId?: string;
    userId?: string;
    deviceInfo?: string;
    ipAddress?: string;
  };

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Company, (company) => company.stockMovements)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  locationRelation: Location;

  @ManyToOne(() => Product, (product) => product.stockMovements)
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Métodos auxiliares
  isIncoming(): boolean {
    return this.type === StockMovementType.IN;
  }

  isOutgoing(): boolean {
    return this.type === StockMovementType.OUT;
  }

  isAdjustment(): boolean {
    return this.type === StockMovementType.ADJUSTMENT;
  }

  isTransfer(): boolean {
    return this.type === StockMovementType.TRANSFER;
  }

  isLoss(): boolean {
    return this.type === StockMovementType.LOSS;
  }

  isReturn(): boolean {
    return this.type === StockMovementType.RETURN;
  }

  getQuantityChange(): number {
    if (this.isIncoming()) {
      return this.quantity;
    } else if (this.isOutgoing()) {
      return -this.quantity;
    }
    return 0;
  }

  getTotalValue(): number {
    return this.quantity * this.unitCost;
  }

  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  getDaysUntilExpiry(): number | null {
    if (!this.expiryDate) return null;
    const today = new Date();
    const expiry = new Date(this.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  isExpiringSoon(daysThreshold: number = 30): boolean {
    const daysUntilExpiry = this.getDaysUntilExpiry();
    if (daysUntilExpiry === null) return false;
    return daysUntilExpiry <= daysThreshold && daysUntilExpiry >= 0;
  }

  getMovementDescription(): string {
    const typeMap = {
      [StockMovementType.IN]: 'Entrada',
      [StockMovementType.OUT]: 'Saída',
      [StockMovementType.ADJUSTMENT]: 'Ajuste',
      [StockMovementType.TRANSFER]: 'Transferência',
      [StockMovementType.LOSS]: 'Perda',
      [StockMovementType.RETURN]: 'Retorno',
    };

    const reasonMap = {
      [StockMovementReason.PURCHASE]: 'Compra',
      [StockMovementReason.SALE]: 'Venda',
      [StockMovementReason.CONSUMPTION]: 'Consumo',
      [StockMovementReason.ADJUSTMENT]: 'Ajuste',
      [StockMovementReason.TRANSFER]: 'Transferência',
      [StockMovementReason.LOSS]: 'Perda',
      [StockMovementReason.RETURN]: 'Retorno',
      [StockMovementReason.INITIAL_STOCK]: 'Estoque Inicial',
      [StockMovementReason.INVENTORY_COUNT]: 'Contagem de Inventário',
    };

    return `${typeMap[this.type]} - ${reasonMap[this.reason]}`;
  }

  calculateQuantityAfter(): void {
    if (this.isIncoming()) {
      this.quantityAfter = this.quantityBefore + this.quantity;
    } else if (this.isOutgoing()) {
      this.quantityAfter = this.quantityBefore - this.quantity;
    } else {
      this.quantityAfter = this.quantity; // para ajustes
    }
  }
}
