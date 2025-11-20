import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantToOrdersTables1700123465000 implements MigrationInterface {
  name = 'AddTenantToOrdersTables1700123465000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cliente_gp_orders ADD tenantId char(36) NULL`);
    await queryRunner.query(`ALTER TABLE cliente_gp_order_items ADD tenantId char(36) NULL`);
    await queryRunner.query(`ALTER TABLE cliente_gp_tables ADD tenantId char(36) NULL`);

    await queryRunner.query(`
      UPDATE cliente_gp_orders o
      INNER JOIN cliente_gp_companies c ON o.companyId = c.id
      SET o.tenantId = c.tenantId
      WHERE o.tenantId IS NULL
    `);

    await queryRunner.query(`
      UPDATE cliente_gp_order_items oi
      INNER JOIN cliente_gp_orders o ON oi.orderId = o.id
      SET oi.tenantId = o.tenantId
      WHERE oi.tenantId IS NULL
    `);

    await queryRunner.query(`
      UPDATE cliente_gp_tables t
      INNER JOIN cliente_gp_companies c ON t.companyId = c.id
      SET t.tenantId = c.tenantId
      WHERE t.tenantId IS NULL
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cliente_gp_tables DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE cliente_gp_order_items DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE cliente_gp_orders DROP COLUMN tenantId`);
  }
}


