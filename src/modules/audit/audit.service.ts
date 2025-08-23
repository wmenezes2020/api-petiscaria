import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditLogAction } from 'src/entities';
import { AuditLogQueryDto, AuditLogResponseDto } from './dto';

interface LogParams {
  userId: string;
  userName: string;
  action: AuditLogAction;
  entityName: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  companyId: string;
  locationId?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: LogParams): Promise<void> {
    const logEntry = this.auditLogRepository.create(params);
    await this.auditLogRepository.save(logEntry);
  }

  async findAll(
    query: AuditLogQueryDto,
    companyId: string,
  ): Promise<{ data: AuditLogResponseDto[]; count: number }> {
    const { page = 1, limit = 10, ...filters } = query;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');
    queryBuilder
      .where('log.companyId = :companyId', { companyId })
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.userId) queryBuilder.andWhere('log.userId = :userId', { userId: filters.userId });
    if (filters.locationId) queryBuilder.andWhere('log.locationId = :locationId', { locationId: filters.locationId });
    if (filters.action) queryBuilder.andWhere('log.action = :action', { action: filters.action });
    if (filters.entityName) queryBuilder.andWhere('log.entityName = :entityName', { entityName: filters.entityName });
    if (filters.entityId) queryBuilder.andWhere('log.entityId = :entityId', { entityId: filters.entityId });

    const [logs, count] = await queryBuilder.getManyAndCount();
    const data = logs.map(log => new AuditLogResponseDto(log));
    return { data, count };
  }
}



