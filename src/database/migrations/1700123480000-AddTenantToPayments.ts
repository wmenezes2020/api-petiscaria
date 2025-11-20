import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantToPayments1700123480000 implements MigrationInterface {
  name = 'AddTenantToPayments1700123480000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cliente_gp_payments ADD tenantId char(36) NULL`);

    await queryRunner.query(`
      UPDATE cliente_gp_payments p
      INNER JOIN cliente_gp_orders o ON p.orderId = o.id
      SET p.tenantId = o.tenantId
      WHERE p.tenantId IS NULL
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cliente_gp_payments DROP COLUMN tenantId`);
  }
}


