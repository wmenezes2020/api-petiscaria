import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../../entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto, companyId: string): Promise<Supplier> {
    const supplier = this.suppliersRepository.create({
      ...createSupplierDto,
      companyId,
      status: 'ACTIVE',
    });

    return await this.suppliersRepository.save(supplier);
  }

  async findAll(query: SupplierQueryDto, companyId: string): Promise<{ data: Supplier[]; total: number }> {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.suppliersRepository
      .createQueryBuilder('supplier')
      .where('supplier.companyId = :companyId', { companyId });

    if (search) {
      queryBuilder.andWhere(
        '(supplier.name ILIKE :search OR supplier.contactName ILIKE :search OR supplier.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('supplier.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .orderBy('supplier.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, companyId: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({
      where: { id, companyId },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto, companyId: string): Promise<Supplier> {
    const supplier = await this.findOne(id, companyId);

    Object.assign(supplier, updateSupplierDto);
    return await this.suppliersRepository.save(supplier);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const supplier = await this.findOne(id, companyId);
    
    // Soft delete - apenas marca como inativo
    supplier.status = 'INACTIVE';
    await this.suppliersRepository.save(supplier);
  }

  async findByStatus(status: string, companyId: string): Promise<Supplier[]> {
    return await this.suppliersRepository.find({
      where: { status, companyId },
      order: { name: 'ASC' },
    });
  }
}
