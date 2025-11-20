import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ModifierGroup } from './modifier-group.entity';

@Entity('cliente_gp_modifier_options')
export class ModifierOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;
  
  @Column({ type: 'uuid' })
  modifierGroupId: string;

  // Relacionamentos
  @ManyToOne(() => ModifierGroup, (group) => group.options)
  @JoinColumn({ name: 'modifierGroupId' })
  modifierGroup: ModifierGroup;
}



