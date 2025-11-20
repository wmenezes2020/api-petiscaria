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
import { Exclude } from 'class-transformer';
import { Company } from './company.entity';
import { Order } from './order.entity';
import { Location } from './location.entity';
import { Tenant } from './tenant.entity';
import { Role } from './role.entity';
import { TenantUser } from './tenant-user.entity';
import { UserToken } from './user-token.entity';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  WAITER = 'waiter',
  KITCHEN = 'kitchen',
  DELIVERY = 'delivery',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('cliente_gp_users')
@Index(['email', 'tenantId'], { unique: true })
@Index(['locationId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ 
    type: 'enum',
    enum: UserRole,
    default: UserRole.WAITER
  })
  role: UserRole;

  @Column({ 
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE
  })
  status: UserStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cpf: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  zipCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salary: number;

  @Column({ type: 'date', nullable: true })
  hireDate: Date;

  @Column({ type: 'boolean', default: false })
  isTwoFactorEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twoFactorSecret: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp: string;

  @Column({ type: 'json', nullable: true })
  permissions: {
    canManageUsers: boolean;
    canManageProducts: boolean;
    canManageOrders: boolean;
    canManageCustomers: boolean;
    canManageStock: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
    canManagePayments: boolean;
  };

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid', nullable: true })
  roleId: string;

  @Column({ type: 'uuid', nullable: true }) // Permitir nulo inicialmente para migração
  locationId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.tenantUsers)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Company, (company) => company.users)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  roleEntity: Role;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @OneToMany(() => Order, (order) => order.createdBy)
  orders: Order[];

  @OneToMany(() => TenantUser, (tenantUser) => tenantUser.user)
  tenantMemberships: TenantUser[];

  @OneToMany(() => UserToken, (token) => token.user)
  tokens: UserToken[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos auxiliares
  hasPermission(permission: keyof User['permissions']): boolean {
    if (this.permissions?.[permission]) {
      return true;
    }

    const rolePermissions = this.roleEntity?.permissions?.map((perm) => perm.key) || [];
    return rolePermissions.includes(permission as string);
  }

  isOwner(): boolean {
    return this.role === UserRole.OWNER;
  }

  isAdmin(): boolean {
    return this.role === UserRole.OWNER || this.role === UserRole.ADMIN;
  }

  isManager(): boolean {
    return this.role === UserRole.OWNER || this.role === UserRole.ADMIN || this.role === UserRole.MANAGER;
  }
}

