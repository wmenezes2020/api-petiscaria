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
import { Location } from './location.entity';
import { Tenant } from './tenant.entity';

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
  VIP = 'vip',
}

@Entity('cliente_gp_customers')
@Index(['tenantId', 'companyId'])
@Index(['tenantId', 'companyId', 'locationId'])
@Index(['tenantId', 'companyId', 'email'], { unique: true })
@Index(['tenantId', 'companyId', 'phone'])
@Index(['tenantId', 'companyId', 'cpf'], { unique: true })
@Index(['tenantId', 'companyId', 'cnpj'], { unique: true })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cpf: string;

  @Column({ type: 'varchar', length: 18, nullable: true })
  cnpj: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'individual',
    comment: 'individual, corporate, vip'
  })
  type: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'active',
    comment: 'active, inactive, blocked'
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  zipCode: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  @Column({ type: 'int', default: 0 })
  totalVisits: number;

  @Column({ type: 'timestamp', nullable: true })
  lastVisitAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastVisitDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastOrderAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageTicket: number;

  @Column({ type: 'json', nullable: true })
  preferences: {
    favoriteCategories?: string[];
    dietaryRestrictions?: string[];
    allergies?: string[];
    preferredPaymentMethod?: string;
    preferredDeliveryTime?: string;
    notes?: string;
  };

  @Column({ type: 'json', nullable: true })
  metadata: {
    source?: string;
    tags?: string[];
    marketingConsent?: boolean;
    loyaltyPoints?: number;
    referralCode?: string;
    referredBy?: string;
  };

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid', nullable: true })
  locationId: string; // Filial de origem ou preferida

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @OneToMany(() => Order, (order) => order.customerId)
  orders: Order[];

  // Métodos auxiliares
  isActive(): boolean {
    return this.status === 'active';
  }

  isVIP(): boolean {
    return this.type === 'vip';
  }

  isCorporate(): boolean {
    return this.type === 'corporate';
  }

  hasValidContact(): boolean {
    return !!(this.email || this.phone);
  }

  getFullAddress(): string {
    const parts = [this.address, this.city, this.state, this.zipCode].filter(Boolean);
    return parts.join(', ');
  }

  getAge(): number | null {
    if (!this.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  updateVisitStats(): void {
    this.totalVisits++;
    this.lastVisitAt = new Date();
  }

  updateOrderStats(orderTotal: number): void {
    this.totalOrders++;
    this.totalSpent += orderTotal;
    this.averageTicket = this.totalSpent / this.totalOrders;
    this.lastOrderAt = new Date();
  }

  getLoyaltyTier(): string {
    if (this.totalSpent >= 1000) return 'gold';
    if (this.totalSpent >= 500) return 'silver';
    if (this.totalSpent >= 100) return 'bronze';
    return 'new';
  }
}
