import { AuditLog } from 'src/entities';

export class AuditLogResponseDto {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityName: string;
  entityId: string;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  ipAddress: string;
  locationId: string;
  createdAt: Date;

  constructor(log: AuditLog) {
    this.id = log.id;
    this.userId = log.userId;
    this.userName = log.userName;
    this.action = log.action;
    this.entityName = log.entityName;
    this.entityId = log.entityId;
    this.oldValues = log.oldValues;
    this.newValues = log.newValues;
    this.ipAddress = log.ipAddress;
    this.locationId = log.locationId;
    this.createdAt = log.createdAt;
  }
}



