import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Purchase } from './purchase.entity';
import { Ingredient } from './ingredient.entity';
import { Company } from './company.entity';

@Entity('cliente_petiscaria_purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  purchaseId: string;

  @Column({ type: 'uuid' })
  ingredientId: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relacionamentos
  @ManyToOne(() => Purchase, (purchase) => purchase.items)
  @JoinColumn({ name: 'purchaseId' })
  purchase: Purchase;

  @ManyToOne(() => Ingredient)
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;
}
