import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Company } from './company.entity';
import { Location } from './location.entity';

export enum AuditLogAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS = 'access',
}

@Entity('cliente_petiscaria_audit_logs')
@Index(['companyId', 'action', 'entityName'])
@Index(['locationId', 'action', 'entityName'])
@Index(['userId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  userName: string;

  @Column({ type: 'enum', enum: AuditLogAction })
  action: AuditLogAction;

  @Column({ type: 'varchar', length: 100 })
  entityName: string;

  @Column({ type: 'uuid' })
  entityId: string;
  
  @Column({ type: 'json', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  newValues: Record<string, any>;
  
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid', nullable: true })
  locationId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relacionamentos
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;
}



