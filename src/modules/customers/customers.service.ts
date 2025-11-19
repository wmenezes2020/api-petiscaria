import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto, CustomerResponseDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async createCustomer(createCustomerDto: CreateCustomerDto, companyId: string, tenantId: string): Promise<CustomerResponseDto> {
    // Verificar se já existe cliente com o mesmo email na empresa
    const existingCustomer = await this.customerRepository.findOne({
      where: { email: createCustomerDto.email, companyId, tenantId },
    });

    if (existingCustomer) {
      throw new ConflictException('Já existe um cliente com este email');
    }

    // Verificar se já existe cliente com o mesmo CPF/CNPJ na empresa
    if (createCustomerDto.cpf) {
      const existingCpf = await this.customerRepository.findOne({
        where: { cpf: createCustomerDto.cpf, companyId, tenantId },
      });

      if (existingCpf) {
        throw new ConflictException('Já existe um cliente com este CPF');
      }
    }

    if (createCustomerDto.cnpj) {
      const existingCnpj = await this.customerRepository.findOne({
        where: { cnpj: createCustomerDto.cnpj, companyId, tenantId },
      });

      if (existingCnpj) {
        throw new ConflictException('Já existe um cliente com este CNPJ');
      }
    }

    // Criar o cliente
    const customer = this.customerRepository.create({
      ...createCustomerDto,
      companyId,
      tenantId,
      isActive: createCustomerDto.isActive ?? true,
    });

    const savedCustomer = await this.customerRepository.save(customer);
    return this.mapCustomerToResponse(savedCustomer);
  }

  async findAll(query: CustomerQueryDto, companyId: string, tenantId: string): Promise<{ customers: CustomerResponseDto[]; total: number }> {
    const queryBuilder = this.buildQueryBuilder(query, companyId, tenantId);
    
    const [customers, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const customerResponses = await Promise.all(
      customers.map(customer => this.mapCustomerToResponse(customer))
    );

    return { customers: customerResponses, total };
  }

  async findOne(id: string, companyId: string, tenantId: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, companyId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.mapCustomerToResponse(customer);
  }

  async findByEmail(email: string, companyId: string, tenantId: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerRepository.findOne({
      where: { email, companyId, tenantId },
    });

    return customer ? this.mapCustomerToResponse(customer) : null;
  }

  async findByCpf(cpf: string, companyId: string, tenantId: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerRepository.findOne({
      where: { cpf, companyId, tenantId },
    });

    return customer ? this.mapCustomerToResponse(customer) : null;
  }

  async findByCnpj(cnpj: string, companyId: string, tenantId: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerRepository.findOne({
      where: { cnpj, companyId, tenantId },
    });

    return customer ? this.mapCustomerToResponse(customer) : null;
  }

  async updateCustomer(id: string, updateCustomerDto: UpdateCustomerDto, companyId: string, tenantId: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, companyId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se o email já está em uso por outro cliente
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { email: updateCustomerDto.email, companyId, tenantId },
      });

      if (existingCustomer) {
        throw new ConflictException('Já existe um cliente com este email');
      }
    }

    // Verificar se o CPF já está em uso por outro cliente
    if (updateCustomerDto.cpf && updateCustomerDto.cpf !== customer.cpf) {
      const existingCpf = await this.customerRepository.findOne({
        where: { cpf: updateCustomerDto.cpf, companyId, tenantId },
      });

      if (existingCpf) {
        throw new ConflictException('Já existe um cliente com este CPF');
      }
    }

    // Verificar se o CNPJ já está em uso por outro cliente
    if (updateCustomerDto.cnpj && updateCustomerDto.cnpj !== customer.cnpj) {
      const existingCnpj = await this.customerRepository.findOne({
        where: { cnpj: updateCustomerDto.cnpj, companyId, tenantId },
      });

      if (existingCnpj) {
        throw new ConflictException('Já existe um cliente com este CNPJ');
      }
    }

    // Atualizar o cliente
    await this.customerRepository.update(id, updateCustomerDto);

    // Retornar o cliente atualizado
    return this.findOne(id, companyId, tenantId);
  }

  async deleteCustomer(id: string, companyId: string, tenantId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id, companyId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Soft delete - marcar como inativo
    await this.customerRepository.update(id, { isActive: false });
  }

  async activateCustomer(id: string, companyId: string, tenantId: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, companyId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.customerRepository.update(id, { isActive: true });
    return this.findOne(id, companyId, tenantId);
  }

  async deactivateCustomer(id: string, companyId: string, tenantId: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, companyId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.customerRepository.update(id, { isActive: false });
    return this.findOne(id, companyId, tenantId);
  }

  async getCustomerStats(companyId: string, tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    topCities: Array<{ city: string; count: number }>;
  }> {
    const total = await this.customerRepository.count({ where: { companyId, tenantId } });
    const active = await this.customerRepository.count({ where: { companyId, tenantId, status: 'active' } });
    const inactive = await this.customerRepository.count({ where: { companyId, tenantId, status: 'inactive' } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await this.customerRepository.count({
      where: {
        companyId,
        tenantId,
        createdAt: startOfMonth,
      },
    });

    const topCities = await this.customerRepository
      .createQueryBuilder('customer')
      .select('customer.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('customer.companyId = :companyId', { companyId })
      .andWhere('customer.tenantId = :tenantId', { tenantId })
      .andWhere('customer.city IS NOT NULL')
      .andWhere('customer.city != ""')
      .groupBy('customer.city')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      total,
      active,
      inactive,
      newThisMonth,
      topCities: topCities.map(item => ({
        city: item.city,
        count: parseInt(item.count),
      })),
    };
  }

  private buildQueryBuilder(query: CustomerQueryDto, companyId: string, tenantId: string): SelectQueryBuilder<Customer> {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.companyId = :companyId', { companyId })
      .andWhere('customer.tenantId = :tenantId', { tenantId });

    if (query.search) {
      queryBuilder.andWhere(
        '(customer.name LIKE :search OR customer.email LIKE :search OR customer.phone LIKE :search OR customer.cpf LIKE :search OR customer.cnpj LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.status) {
      if (query.status === 'active') {
        queryBuilder.andWhere('customer.status = :status', { status: 'active' });
      } else if (query.status === 'inactive') {
        queryBuilder.andWhere('customer.status = :status', { status: 'inactive' });
      }
    } else if (!query.includeInactive) {
      queryBuilder.andWhere('customer.status = :status', { status: 'active' });
    }

    if (query.city) {
      queryBuilder.andWhere('customer.city = :city', { city: query.city });
    }

    if (query.state) {
      queryBuilder.andWhere('customer.state = :state', { state: query.state });
    }

    if (query.tags) {
      const tags = query.tags.split(',').map(tag => tag.trim());
      queryBuilder.andWhere('JSON_CONTAINS(customer.metadata->>"$.tags", :tags)', { tags: JSON.stringify(tags) });
    }

    if (query.startDate) {
      queryBuilder.andWhere('customer.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('customer.createdAt <= :endDate', { endDate: query.endDate });
    }

    // Ordenação
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`customer.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  private async mapCustomerToResponse(customer: Customer): Promise<CustomerResponseDto> {
    // Aqui você pode adicionar lógica para calcular totalOrders e totalSpent
    // baseado nos pedidos do cliente
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      cpf: customer.cpf,
      cnpj: customer.cnpj,
      birthDate: customer.birthDate,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      notes: customer.notes,
      isActive: customer.status === 'active',
      preferences: customer.preferences,
      metadata: customer.metadata,
      companyId: customer.companyId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      lastVisitDate: customer.lastVisitDate,
      totalOrders: 0, // TODO: Implementar cálculo baseado nos pedidos
      totalSpent: 0, // TODO: Implementar cálculo baseado nos pedidos
    };
  }
}
