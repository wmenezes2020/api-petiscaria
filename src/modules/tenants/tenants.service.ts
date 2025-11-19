import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../entities/tenant.entity';
import { UpdateTenantDto } from './dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }
    return tenant;
  }

  async updateTenant(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    await this.tenantRepository.update(id, dto);
    return this.findById(id);
  }
}


