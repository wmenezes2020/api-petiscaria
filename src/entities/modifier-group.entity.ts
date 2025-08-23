import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  ManyToMany,
} from 'typeorm';
import { Company } from './company.entity';
import { ModifierOption } from './modifier-option.entity';
import { Product } from './product.entity';
import { Location } from './location.entity';

export enum ModifierGroupType {
  SINGLE = 'single', // O cliente só pode escolher uma opção (ex: ponto da carne)
  MULTIPLE = 'multiple', // O cliente pode escolher várias opções (ex: adicionais)
}

@Entity('cliente_petiscaria_modifier_groups')
@Index(['companyId'])
@Index(['locationId'])
export class ModifierGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: ModifierGroupType,
    default: ModifierGroupType.SINGLE,
  })
  type: ModifierGroupType;

  @Column({ type: 'int', nullable: true })
  minSelection: number;

  @Column({ type: 'int', nullable: true })
  maxSelection: number;
  
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

  @OneToMany(() => ModifierOption, (option) => option.modifierGroup, { cascade: true })
  options: ModifierOption[];

  @ManyToMany(() => Product, (product) => product.modifierGroups)
  products: Product[];
}
