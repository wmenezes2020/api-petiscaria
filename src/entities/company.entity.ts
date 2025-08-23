import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Product } from './product.entity';
import { StockMovement } from './stock-movement.entity';
import { Ingredient } from './ingredient.entity';

@Entity('cliente_petiscaria_companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fantasia: string;

  @Column({ name: 'razao_social' })
  razaoSocial: string;

  @Column({ unique: true })
  documento: string; // CNPJ

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'cnpj', nullable: false })
  cnpj: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  banner: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: 'basic' })
  plan: string;

  @Column({ nullable: true })
  planExpiresAt: Date;

  @Column('json', { nullable: true, name: 'pix_config' })
  pixConfig: any;

  @Column({ nullable: true })
  timezone: string;

  @Column({ default: true })
  active: boolean;

  @Column('json', { nullable: true })
  settings: any;

  @Column('json', { nullable: true })
  openPixConfig: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Category, (category) => category.company)
  categories: Category[];

  @OneToMany(() => Product, (product) => product.company)
  products: Product[];

  @OneToMany(() => StockMovement, (stockMovement) => stockMovement.company)
  stockMovements: StockMovement[];

  @OneToMany(() => Ingredient, (ingredient) => ingredient.company)
  ingredients: Ingredient[];

  // Getters para compatibilidade
  get displayName(): string {
    return this.fantasia;
  }

  get isActive(): boolean {
    return this.active;
  }
}

