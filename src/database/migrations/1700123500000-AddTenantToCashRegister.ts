import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddTenantToCashRegister1700123500000 implements MigrationInterface {
  name = 'AddTenantToCashRegister1700123500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cashRegistersTable = 'cliente_petiscaria_cash_registers';
    const cashMovementsTable = 'cliente_petiscaria_cash_movements';

    if (!(await queryRunner.hasColumn(cashRegistersTable, 'tenantId'))) {
      await queryRunner.query(`ALTER TABLE ${cashRegistersTable} ADD tenantId char(36) NULL`);
    }

    if (!(await queryRunner.hasColumn(cashMovementsTable, 'tenantId'))) {
      await queryRunner.query(`ALTER TABLE ${cashMovementsTable} ADD tenantId char(36) NULL`);
    }

    await queryRunner.query(`
      UPDATE cliente_petiscaria_cash_registers cr
      INNER JOIN cliente_petiscaria_companies c ON cr.companyId = c.id
      SET cr.tenantId = c.tenantId
      WHERE cr.tenantId IS NULL OR cr.tenantId = ''
    `);

    await queryRunner.query(`
      UPDATE cliente_petiscaria_cash_movements cm
      INNER JOIN cliente_petiscaria_cash_registers cr ON cm.cashRegisterId = cr.id
      SET cm.tenantId = cr.tenantId
      WHERE cm.tenantId IS NULL OR cm.tenantId = ''
    `);

    const cashRegistersTableInfo = await queryRunner.getTable(cashRegistersTable);
    const cashMovementsTableInfo = await queryRunner.getTable(cashMovementsTable);

    if (
      cashRegistersTableInfo &&
      !cashRegistersTableInfo.foreignKeys.find((fk) => fk.name === 'FK_cash_registers_tenants')
    ) {
      await queryRunner.createForeignKey(
        cashRegistersTable,
        new TableForeignKey({
          name: 'FK_cash_registers_tenants',
          columnNames: ['tenantId'],
          referencedTableName: 'cliente_petiscaria_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'NO ACTION',
        }),
      );
    }

    if (
      cashMovementsTableInfo &&
      !cashMovementsTableInfo.foreignKeys.find((fk) => fk.name === 'FK_cash_movements_tenants')
    ) {
      await queryRunner.createForeignKey(
        cashMovementsTable,
        new TableForeignKey({
          name: 'FK_cash_movements_tenants',
          columnNames: ['tenantId'],
          referencedTableName: 'cliente_petiscaria_tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'NO ACTION',
        }),
      );
    }

    await queryRunner.query(`ALTER TABLE ${cashRegistersTable} MODIFY COLUMN tenantId char(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE ${cashMovementsTable} MODIFY COLUMN tenantId char(36) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cashRegistersTable = 'cliente_petiscaria_cash_registers';
    const cashMovementsTable = 'cliente_petiscaria_cash_movements';

    await queryRunner.query(`ALTER TABLE ${cashMovementsTable} DROP FOREIGN KEY FK_cahr_movements_tenants`);
    await queryRunner.query(`ALTER TABLE ${cashRegistersTable} DROP FOREIGN KEY FK_cash_registers_tenants`);

    await queryRunner.query(`ALTER TABLE ${cashMovementsTable} DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE ${cashRegistersTable} DROP COLUMN tenantId`);
  }
}
