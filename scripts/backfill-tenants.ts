import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import dataSource from '../typeorm.config';
import { Company } from '../src/entities/company.entity';
import { Tenant, TenantStatus } from '../src/entities/tenant.entity';
import { User } from '../src/entities/user.entity';

async function ensureDataSource(ds: DataSource) {
  if (!ds.isInitialized) {
    await ds.initialize();
  }
  return ds;
}

async function backfillTenants() {
    const ds = await ensureDataSource(dataSource);
    const companyRepo = ds.getRepository(Company);
    const tenantRepo = ds.getRepository(Tenant);
    const userRepo = ds.getRepository(User);

    const companies = await companyRepo.find();
    const tenantMap = new Map<string, string>();

    for (const company of companies) {
      if (company.tenantId && company.tenantId !== '') {
        tenantMap.set(company.id, company.tenantId);
        continue;
      }

      const tenant = tenantRepo.create({
        id: randomUUID(),
        name: company.name || company.fantasia || 'Empresa sem nome',
        legalName: company.razaoSocial || company.name || company.fantasia || 'N/A',
        document: company.documento || company.cnpj || null,
        primaryEmail: (company as any).email || null,
        primaryPhone: (company as any).phone || null,
        status: TenantStatus.ACTIVE,
        plan: 'basic',
        planExpiresAt: null,
        billingInfo: null,
        configPix: null,
        settings: null,
        timezone: (company as any).timezone || 'America/Sao_Paulo',
        isActive: true,
      });

      await tenantRepo.save(tenant);
      await companyRepo.update(company.id, { tenantId: tenant.id });
      tenantMap.set(company.id, tenant.id);
      console.log(`Associado tenant ${tenant.id} -> empresa ${company.id}`);
    }

    const usersWithoutTenant = await userRepo
      .createQueryBuilder('user')
      .where('user.tenantId IS NULL OR user.tenantId = ""')
      .getMany();

    for (const user of usersWithoutTenant) {
      const tenantId = tenantMap.get(user.companyId);
      if (!tenantId) {
        console.warn(`Usuário ${user.id} sem tenant e empresa ${user.companyId} não encontrada.`);
        continue;
      }
      await userRepo.update(user.id, { tenantId });
      console.log(`Atualizado usuário ${user.id} com tenant ${tenantId}`);
    }

    console.log('Backfill concluído.');
    await ds.destroy();
}

backfillTenants()
  .then(() => {
    console.log('Script finalizado com sucesso.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar backfill de tenants:', error);
    process.exit(1);
  });

