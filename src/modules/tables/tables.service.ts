import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Table, TableStatus, TableShape } from '../../entities/table.entity';
import { CreateTableDto, UpdateTableDto, UpdateTableStatusDto, TableQueryDto, TableResponseDto } from './dto';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
  ) {}

  async create(createTableDto: CreateTableDto, companyId: string): Promise<TableResponseDto> {
    // Verificar se já existe uma mesa com o mesmo número
    const existingTable = await this.tableRepository.findOne({
      where: { number: createTableDto.name, companyId },
    });

    if (existingTable) {
      throw new BadRequestException('Já existe uma mesa com este nome');
    }

    // Criar a mesa
    const table = this.tableRepository.create({
      ...createTableDto,
      companyId,
      number: createTableDto.name,
      status: TableStatus.AVAILABLE,
    });

    const savedTable = await this.tableRepository.save(table);
    return this.mapTableToResponse(savedTable);
  }

  async findAll(query: TableQueryDto, companyId: string): Promise<{ tables: TableResponseDto[]; total: number }> {
    // Garantir valores padrão válidos
    const page = query.page || 1;
    const limit = query.limit || 20;
    
    const queryBuilder = this.buildQueryBuilder(query, companyId);
    
    const [tables, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const tableResponses = tables.map(table => this.mapTableToResponse(table));
    return { tables: tableResponses, total };
  }

  async findOne(id: string, companyId: string): Promise<TableResponseDto> {
    const table = await this.tableRepository.findOne({
      where: { id, companyId },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    return this.mapTableToResponse(table);
  }

  async update(id: string, updateTableDto: UpdateTableDto, companyId: string): Promise<TableResponseDto> {
    const table = await this.tableRepository.findOne({
      where: { id, companyId },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    // Verificar se o novo nome já existe em outra mesa
    if (updateTableDto.name && updateTableDto.name !== table.name) {
      const existingTable = await this.tableRepository.findOne({
        where: { name: updateTableDto.name, companyId },
      });

      if (existingTable) {
        throw new BadRequestException('Já existe uma mesa com este nome');
      }
    }

    // Atualizar a mesa
    await this.tableRepository.update(id, updateTableDto);

    // Retornar a mesa atualizada
    return this.findOne(id, companyId);
  }

  async updateStatus(id: string, updateStatusDto: UpdateTableStatusDto, companyId: string): Promise<TableResponseDto> {
    const table = await this.tableRepository.findOne({
      where: { id, companyId },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    // Atualizar o status da mesa
    await this.tableRepository.update(id, { status: updateStatusDto.status as unknown as TableStatus });

    // Retornar a mesa atualizada
    return this.findOne(id, companyId);
  }

  async findByArea(area: string, companyId: string): Promise<TableResponseDto[]> {
    const tables = await this.tableRepository
      .createQueryBuilder('table')
      .leftJoinAndSelect('table.areaRelation', 'area')
      .where('area.name = :areaName', { areaName: area })
      .andWhere('table.companyId = :companyId', { companyId })
      .orderBy('table.name', 'ASC')
      .getMany();

    return tables.map(table => this.mapTableToResponse(table));
  }

  async remove(id: string, companyId: string): Promise<void> {
    const table = await this.tableRepository.findOne({
      where: { id, companyId },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    // Soft delete - marcar como inativa
    await this.tableRepository.update(id, { isActive: false });
  }

  async reserveTable(id: string, companyId: string, reservationData: {
    customerName: string;
    customerPhone: string;
    reservationTime: Date;
    customerCount: number;
    notes?: string;
  }): Promise<TableResponseDto> {
    const table = await this.tableRepository.findOne({
      where: { id, companyId },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.status !== TableStatus.AVAILABLE) {
      throw new BadRequestException('Mesa não está disponível para reserva');
    }

    // Atualizar status para reservada
    await this.tableRepository.update(id, {
      status: TableStatus.RESERVED,
    });

    return this.findOne(id, companyId);
  }

  async getAvailableTables(companyId: string, customerCount?: number): Promise<TableResponseDto[]> {
    const queryBuilder = this.tableRepository
      .createQueryBuilder('table')
      .where('table.companyId = :companyId', { companyId })
      .andWhere('table.isActive = :isActive', { isActive: true })
      .andWhere('table.status = :status', { status: TableStatus.AVAILABLE });

    if (customerCount) {
      queryBuilder.andWhere('table.capacity >= :customerCount', { customerCount });
    }

    const tables = await queryBuilder.getMany();
    return tables.map(table => this.mapTableToResponse(table));
  }

  async getTableStats(companyId: string): Promise<{
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
    maintenance: number;
  }> {
    const stats = await this.tableRepository
      .createQueryBuilder('table')
      .select('table.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('table.companyId = :companyId', { companyId })
      .andWhere('table.isActive = :isActive', { isActive: true })
      .groupBy('table.status')
      .getRawMany();

    const result = {
      total: 0,
      available: 0,
      occupied: 0,
      reserved: 0,
      cleaning: 0,
      maintenance: 0,
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      result.total += count;
      
      switch (stat.status) {
        case TableStatus.AVAILABLE:
          result.available = count;
          break;
        case TableStatus.OCCUPIED:
          result.occupied = count;
          break;
        case TableStatus.RESERVED:
          result.reserved = count;
          break;
        case TableStatus.CLEANING:
          result.cleaning = count;
          break;
        case TableStatus.OUT_OF_SERVICE:
          result.maintenance = count; // Usar maintenance como outOfService
          break;
      }
    });

    return result;
  }

  private buildQueryBuilder(query: TableQueryDto, companyId: string): SelectQueryBuilder<Table> {
    const queryBuilder = this.tableRepository
      .createQueryBuilder('table')
      .leftJoinAndSelect('table.areaRelation', 'area')
      .where('table.companyId = :companyId', { companyId });

    if (query.search) {
      queryBuilder.andWhere(
        '(table.name LIKE :search OR table.description LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.status) {
      queryBuilder.andWhere('table.status = :status', { status: query.status });
    }

    if (query.shape) {
      queryBuilder.andWhere('table.shape = :shape', { shape: query.shape });
    }

    if (query.area) {
      queryBuilder.andWhere('area.name = :areaName', { areaName: query.area });
    }

    if (query.minCapacity) {
      queryBuilder.andWhere('table.capacity >= :minCapacity', { minCapacity: query.minCapacity });
    }

    if (query.maxCapacity) {
      queryBuilder.andWhere('table.capacity <= :maxCapacity', { maxCapacity: query.maxCapacity });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('table.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.isSmoking !== undefined) {
      queryBuilder.andWhere('table.isSmoking = :isSmoking', { isSmoking: query.isSmoking });
    }

    if (query.isOutdoor !== undefined) {
      queryBuilder.andWhere('table.isOutdoor = :isOutdoor', { isOutdoor: query.isOutdoor });
    }

    // Ordenação
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'ASC';
    queryBuilder.orderBy(`table.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  private mapTableToResponse(table: Table): TableResponseDto {
    return {
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      shape: table.shape as TableShape,
      x: table.x,
      y: table.y,
      area: table.areaRelation?.name || null, // Usar o nome da área relacionada
      description: table.description,
      isActive: table.isActive,
      isSmoking: table.isSmoking,
      isOutdoor: table.isOutdoor,
      minimumOrder: table.minimumOrder,
      status: table.status as unknown as any,
      currentOrderId: table.currentOrderId,
      currentCustomerCount: table.currentCustomerCount,
      openedAt: table.openedAt,
      metadata: table.metadata,
      companyId: table.companyId,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  }
}

