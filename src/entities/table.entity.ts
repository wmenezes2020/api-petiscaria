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
import { Order } from './order.entity';
import { Area } from './area.entity';
import { Location } from './location.entity';

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLEANING = 'cleaning',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum TableShape {
  ROUND = 'round',
  SQUARE = 'square',
  RECTANGULAR = 'rectangular',
  OVAL = 'oval',
}

@Entity('cliente_petiscaria_tables')
@Index(['companyId'])
@Index(['locationId'])
@Index(['areaId'])
@Index(['status'])
@Index(['number', 'locationId'], { unique: true })
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ 
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE
  })
  status: TableStatus;

  @Column({ 
    type: 'enum',
    enum: TableShape,
    default: TableShape.ROUND
  })
  shape: TableShape;

  @Column({ type: 'int', default: 2 })
  capacity: number;

  @Column({ type: 'int', default: 0 })
  minCapacity: number;

  @Column({ type: 'int', default: 0 })
  maxCapacity: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  x: number; // posição X no mapa da sala

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  y: number; // posição Y no mapa da sala

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumOrder: number;

  @Column({ type: 'uuid', nullable: true })
  currentOrderId: string;

  @Column({ type: 'int', default: 0 })
  currentCustomerCount: number;

  @Column({ type: 'timestamp', nullable: true })
  openedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  areaId: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isReservable: boolean;

  @Column({ type: 'boolean', default: false })
  isSmoking: boolean;

  @Column({ type: 'boolean', default: false })
  isOutdoor: boolean;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string; // cor para identificação visual

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  features: {
    hasPowerOutlet?: boolean;
    hasWifi?: boolean;
    hasView?: boolean;
    isQuiet?: boolean;
    isAccessible?: boolean;
  };

  @Column({ type: 'json', nullable: true })
  metadata: {
    tags?: string[];
    notes?: string;
    maintenanceHistory?: string[];
    lastCleaned?: Date;
  };

  @Column({ type: 'uuid' })
  companyId: string;
  
  @Column({ type: 'uuid', nullable: true })
  locationId: string;

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

  @ManyToOne(() => Area, (area) => area.tables)
  @JoinColumn({ name: 'areaId' })
  areaRelation: Area;

  @OneToMany(() => Order, (order) => order.tableId)
  orders: Order[];

  // Métodos auxiliares
  isAvailable(): boolean {
    return this.status === TableStatus.AVAILABLE;
  }

  isOccupied(): boolean {
    return this.status === TableStatus.OCCUPIED;
  }

  isReserved(): boolean {
    return this.status === TableStatus.RESERVED;
  }

  isCleaning(): boolean {
    return this.status === TableStatus.CLEANING;
  }

  isOutOfService(): boolean {
    return this.status === TableStatus.OUT_OF_SERVICE;
  }

  canBeOccupied(): boolean {
    return this.status === TableStatus.AVAILABLE || this.status === TableStatus.CLEANING;
  }

  canBeReserved(): boolean {
    return this.isReservable && this.status === TableStatus.AVAILABLE;
  }

  getCurrentOrder(): Order | null {
    if (!this.orders) return null;
    return this.orders.find(order => 
      order.status === 'open' || order.status === 'preparing' || order.status === 'ready'
    ) || null;
  }

  getDisplayName(): string {
    return this.name || `Mesa ${this.number}`;
  }

  getCapacityRange(): string {
    if (this.minCapacity === 0 && this.maxCapacity === 0) {
      return `${this.capacity} pessoas`;
    }
    return `${this.minCapacity}-${this.maxCapacity} pessoas`;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  markAsOccupied(): void {
    this.status = TableStatus.OCCUPIED;
  }

  markAsAvailable(): void {
    this.status = TableStatus.AVAILABLE;
  }

  markAsCleaning(): void {
    this.status = TableStatus.CLEANING;
  }

  markAsReserved(): void {
    this.status = TableStatus.RESERVED;
  }

  markAsOutOfService(): void {
    this.status = TableStatus.OUT_OF_SERVICE;
  }
}
