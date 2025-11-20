import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantToCashRegister1700123500000 implements MigrationInterface {
  name = 'AddTenantToCashRegister1700123500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cashRegistersTable = 'cliente_gp_cash_registers';
    const cashMovementsTable = 'cliente_gp_cash_movements';

    if (!(await queryRunner.hasColumn(cashRegistersTable, 'tenantId'))) {
      await queryRunner.query(`ALTER TABLE ${cashRegistersTable} ADD tenantId char(36) NULL`);
    }

    if (!(await queryRunner.hasColumn(cashMovementsTable, 'tenantId'))) {
      await queryRunner.query(`ALTER TABLE ${cashMovementsTable} ADD tenantId char(36) NULL`);
    }

    await queryRunner.query(`
      UPDATE cliente_gp_cash_registers cr
      INNER JOIN cliente_gp_companies c ON cr.companyId = c.id
      SET cr.tenantId = c.tenantId
      WHERE cr.tenantId IS NULL OR cr.tenantId = ''
    `);

    await queryRunner.query(`
      UPDATE cliente_gp_cash_movements cm
      INNER JOIN cliente_gp_cash_registers cr ON cm.cashRegisterId = cr.id
      SET cm.tenantId = cr.tenantId
      WHERE cm.tenantId IS NULL OR cm.tenantId = ''
    `);

    await queryRunner.query(`ALTER TABLE ${cashRegistersTable} MODIFY COLUMN tenantId char(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE ${cashMovementsTable} MODIFY COLUMN tenantId char(36) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cashRegistersTable = 'cliente_gp_cash_registers';
    const cashMovementsTable = 'cliente_gp_cash_movements';

    await queryRunner.query(`ALTER TABLE ${cashMovementsTable} DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE ${cashRegistersTable} DROP COLUMN tenantId`);
  }
}
