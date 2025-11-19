import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantToCashRegister1700123500000 implements MigrationInterface {
  name = 'AddTenantToCashRegister1700123500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar tenantId a cash_registers
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_cash_registers ADD tenantId char(36) NULL`);
    
    // Adicionar tenantId a cash_movements
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_cash_movements ADD tenantId char(36) NULL`);

    // Backfill: copiar tenantId das companies
    await queryRunner.query(`
      UPDATE cliente_petiscaria_cash_registers cr
      INNER JOIN cliente_petiscaria_companies c ON cr.companyId = c.id
      SET cr.tenantId = c.tenantId
      WHERE cr.tenantId IS NULL
    `);

    await queryRunner.query(`
      UPDATE cliente_petiscaria_cash_movements cm
      INNER JOIN cliente_petiscaria_cash_registers cr ON cm.cashRegisterId = cr.id
      SET cm.tenantId = cr.tenantId
      WHERE cm.tenantId IS NULL
    `);

    // Adicionar FKs
    await queryRunner.query(`
      ALTER TABLE cliente_petiscaria_cash_registers
      ADD CONSTRAINT FK_cash_registers_tenants FOREIGN KEY (tenantId)
      REFERENCES cliente_petiscaria_tenants(id)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE cliente_petiscaria_cash_movements
      ADD CONSTRAINT FK_cash_movements_tenants FOREIGN KEY (tenantId)
      REFERENCES cliente_petiscaria_tenants(id)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Tornar tenantId NOT NULL após backfill
    await queryRunner.query(`
      ALTER TABLE cliente_petiscaria_cash_registers
      MODIFY COLUMN tenantId char(36) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE cliente_petiscaria_cash_movements
      MODIFY COLUMN tenantId char(36) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_cash_movements DROP FOREIGN KEY FK_cash_movements_tenants`);
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_cash_registers DROP FOREIGN KEY FK_cash_registers_tenants`);

    await queryRunner.query(`ALTER TABLE cliente_petiscaria_cash_movements DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_cash_registers DROP COLUMN tenantId`);
  }
}

