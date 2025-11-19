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
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Company } from './company.entity';
import { Category } from './category.entity';
import { OrderItem } from './order-item.entity';
import { StockMovement } from './stock-movement.entity';
import { ModifierGroup } from './modifier-group.entity';
import { Location } from './location.entity';
import { Tenant } from './tenant.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

export enum ProductType {
  FOOD = 'food',
  DRINK = 'drink',
  DESSERT = 'dessert',
  SIDE_DISH = 'side_dish',
  COMBO = 'combo',
}

@Entity('cliente_petiscaria_products')
@Index(['tenantId', 'companyId'])
@Index(['tenantId', 'companyId', 'name', 'locationId'])
@Index(['tenantId', 'companyId', 'categoryId'])
@Index(['tenantId', 'companyId', 'locationId'])
@Index(['tenantId', 'companyId', 'status'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  promotionalPrice: number;

  @Column({ type: 'date', nullable: true })
  promotionalPriceValidUntil: Date;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'food',
    comment: 'food, drink, dessert, side_dish, combo'
  })
  type: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'active',
    comment: 'active, inactive, out_of_stock, discontinued'
  })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  sku: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  barcode: string;

  @Column({ type: 'decimal', precision: 8, scale: 3, default: 0 })
  weight: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'int', default: 0 })
  minStockLevel: number;

  @Column({ type: 'int', default: 0 })
  maxStockLevel: number;

  @Column({ type: 'int', default: 0 })
  preparationTime: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  weightUnit: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mainImage: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'boolean', default: false })
  requiresPreparation: boolean;

  @Column({ type: 'json', nullable: true })
  allergens: string[];

  @Column({ type: 'json', nullable: true })
  nutritionalInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };

  @Column({ type: 'json', nullable: true })
  metadata: {
    ingredients?: string[];
    cookingInstructions?: string;
    servingSize?: string;
    calories?: number;
    customFields?: Record<string, any>;
  };

  @Column({ type: 'json', nullable: true })
  pricing: {
    basePrice: number;
    taxRate: number;
    discountRate: number;
    bulkPricing?: Array<{
      minQuantity: number;
      price: number;
    }>;
  };

  @Column({ type: 'boolean', default: false })
  isAvailableForDelivery: boolean;

  @Column({ type: 'boolean', default: false })
  isAvailableForTakeaway: boolean;

  @Column({ type: 'boolean', default: false })
  isAvailableForDineIn: boolean;

  @Column({ type: 'boolean', default: false })
  isVegetarian: boolean;

  @Column({ type: 'boolean', default: false })
  isVegan: boolean;

  @Column({ type: 'boolean', default: false })
  isGlutenFree: boolean;

  @Column({ type: 'boolean', default: false })
  isSpicy: boolean;

  @Column({ type: 'int', default: 0 })
  spicinessLevel: number;

  @Column({ type: 'json', nullable: true })
  ingredients: string[];

  @Column({ type: 'json', nullable: true })
  cookingInstructions: string[];

  @Column({ type: 'json', nullable: true })
  servingSuggestions: string[];

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'uuid' })
  companyId: string;
  
  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Company, (company) => company.products)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => StockMovement, (stockMovement) => stockMovement.product)
  stockMovements: StockMovement[];

  @ManyToMany(() => ModifierGroup, (modifierGroup) => modifierGroup.products)
  @JoinTable({
    name: 'cliente_petiscaria_product_modifier_groups',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'modifierGroupId', referencedColumnName: 'id' },
  })
  modifierGroups: ModifierGroup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos auxiliares
  isInStock(): boolean {
    return this.stockQuantity > 0;
  }

  isLowStock(): boolean {
    return this.stockQuantity <= this.minStockLevel;
  }

  getCurrentPrice(): number {
    if (this.promotionalPrice && this.promotionalPriceValidUntil && new Date() <= this.promotionalPriceValidUntil) {
      return this.promotionalPrice;
    }
    return this.price;
  }

  hasDiscount(): boolean {
    return this.promotionalPrice && this.promotionalPriceValidUntil && new Date() <= this.promotionalPriceValidUntil;
  }

  getDiscountPercentage(): number {
    if (!this.hasDiscount()) return 0;
    return Math.round(((this.price - this.promotionalPrice) / this.price) * 100);
  }
}

