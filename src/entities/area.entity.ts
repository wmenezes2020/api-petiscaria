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
} from 'typeorm';
import { Company } from './company.entity';
import { Table } from './table.entity';

@Entity('cliente_petiscaria_areas')
@Index(['companyId'])
export class Area {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;
  
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => Table, (table) => table.areaRelation)
  tables: Table[];
}
