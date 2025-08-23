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
import { Product } from './product.entity';
import { Ingredient } from './ingredient.entity';
import { Company } from './company.entity';

@Entity('cliente_petiscaria_recipes')
@Index(['companyId', 'productId'])
@Index(['companyId', 'name'])
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 1 })
  servings: number;

  @Column({ type: 'int', default: 30 })
  preparationTime: number; // em minutos

  @Column({ type: 'int', default: 0 })
  cookingTime: number; // em minutos

  @Column({ type: 'varchar', length: 500, nullable: true })
  instructions?: string;

  @Column({ type: 'json', nullable: true })
  ingredients: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPerServing: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: {
    difficulty?: string;
    cuisine?: string;
    tags?: string[];
    imageUrl?: string;
    videoUrl?: string;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;
  
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Métodos auxiliares
  calculateTotalCost(): number {
    if (!this.ingredients) return 0;
    return this.ingredients.reduce((total, ingredient) => total + ingredient.cost, 0);
  }

  calculateCostPerServing(): number {
    if (this.servings === 0) return 0;
    return this.totalCost / this.servings;
  }

  getTotalPreparationTime(): number {
    return this.preparationTime + this.cookingTime;
  }
}



