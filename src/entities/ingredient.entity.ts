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
import { Location } from './location.entity';
import { Tenant } from './tenant.entity';

export enum IngredientType {
  RAW_MATERIAL = 'raw_material',
  PROCESSED = 'processed',
  SPICE = 'spice',
  CONDIMENT = 'condiment',
  LIQUID = 'liquid',
  DRY = 'dry',
  FROZEN = 'frozen',
  FRESH = 'fresh',
}

export enum IngredientUnit {
  GRAM = 'gram',
  KILOGRAM = 'kilogram',
  LITER = 'liter',
  MILLILITER = 'milliliter',
  UNIT = 'unit',
  PACKAGE = 'package',
  BOTTLE = 'bottle',
  CAN = 'can',
}

@Entity('cliente_petiscaria_ingredients')
@Index(['tenantId', 'companyId', 'categoryId'])
@Index(['tenantId', 'companyId', 'locationId', 'categoryId'])
@Index(['tenantId', 'companyId', 'ingredientType'])
@Index(['tenantId', 'companyId', 'locationId', 'ingredientType'])
@Index(['tenantId', 'companyId', 'name'])
@Index(['tenantId', 'companyId', 'locationId', 'name'])
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: IngredientType,
    default: IngredientType.RAW_MATERIAL,
  })
  ingredientType: IngredientType;

  @Column({
    type: 'enum',
    enum: IngredientUnit,
    default: IngredientUnit.GRAM,
  })
  unit: IngredientUnit;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  maxStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplierName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brand?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  allergens?: string;

  @Column({ type: 'json', nullable: true })
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
  };

  @Column({ type: 'json', nullable: true })
  storageConditions?: {
    temperature?: string;
    humidity?: string;
    light?: string;
    specialConditions?: string;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Company, (company) => company.ingredients)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  // Métodos auxiliares
  isLowStock(): boolean {
    return this.currentStock <= this.minStock;
  }

  isOverStock(): boolean {
    return this.currentStock >= this.maxStock;
  }

  getStockPercentage(): number {
    if (this.maxStock === 0) return 0;
    return (this.currentStock / this.maxStock) * 100;
  }

  needsRestock(): boolean {
    return this.currentStock <= this.minStock;
  }

  getStockStatus(): 'low' | 'normal' | 'high' {
    if (this.isLowStock()) return 'low';
    if (this.isOverStock()) return 'high';
    return 'normal';
  }

  calculateReorderQuantity(): number {
    return this.maxStock - this.currentStock;
  }

  isExpensive(): boolean {
    return this.unitCost > 50; // Valor arbitrário para exemplo
  }

  hasAllergens(): boolean {
    return !!this.allergens && this.allergens.trim().length > 0;
  }

  getStorageInstructions(): string {
    if (!this.storageConditions) return 'Armazenar em local seco e fresco';
    
    const conditions = this.storageConditions;
    let instructions = '';
    
    if (conditions.temperature) instructions += `Temperatura: ${conditions.temperature}. `;
    if (conditions.humidity) instructions += `Umidade: ${conditions.humidity}. `;
    if (conditions.light) instructions += `Luz: ${conditions.light}. `;
    if (conditions.specialConditions) instructions += `Condições especiais: ${conditions.specialConditions}. `;
    
    return instructions.trim() || 'Armazenar em local seco e fresco';
  }
}

