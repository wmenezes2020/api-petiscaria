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
import { User } from './user.entity';
import { CashMovement } from './cash-movement.entity';
import { Tenant } from './tenant.entity';

export enum CashRegisterStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('cliente_gp_cash_registers')
@Index(['tenantId', 'companyId', 'status'])
export class CashRegister {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  closingBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expectedBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  balanceDifference: number;

  @Column({ type: 'timestamp' })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({
    type: 'enum',
    enum: CashRegisterStatus,
    default: CashRegisterStatus.OPEN,
  })
  status: CashRegisterStatus;

  @Column({ type: 'text', nullable: true })
  openingNotes: string;
  
  @Column({ type: 'text', nullable: true })
  closingNotes: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid' })
  openedById: string;

  @Column({ type: 'uuid', nullable: true })
  closedById: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'openedById' })
  openedBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'closedById' })
  closedBy: User;

  @OneToMany(() => CashMovement, (movement) => movement.cashRegister)
  movements: CashMovement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
