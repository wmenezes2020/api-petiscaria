import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Company } from './company.entity';
import { TenantUser } from './tenant-user.entity';
import { UserToken } from './user-token.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('cliente_gp_tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legalName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  document: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  primaryEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  primaryPhone: string;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
  status: TenantStatus;

  @Column({ type: 'varchar', length: 50, default: 'basic' })
  plan: string;

  @Column({ type: 'timestamp', nullable: true })
  planExpiresAt: Date;

  @Column({ type: 'json', nullable: true })
  billingInfo: {
    contacts?: Array<{ name: string; email: string; phone?: string }>;
    address?: {
      street?: string;
      number?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };

  @Column({ type: 'json', nullable: true })
  configPix: any;

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'varchar', length: 64, nullable: true })
  timezone: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Company, (company) => company.tenant)
  companies: Company[];

  @OneToMany(() => TenantUser, (tenantUser) => tenantUser.tenant)
  tenantUsers: TenantUser[];

  @OneToMany(() => UserToken, (token) => token.tenant)
  tokens: UserToken[];
}


