import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantToPayments1700123480000 implements MigrationInterface {
  name = 'AddTenantToPayments1700123480000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_payments ADD tenantId char(36) NULL`);

    await queryRunner.query(`
      UPDATE cliente_petiscaria_payments p
      INNER JOIN cliente_petiscaria_orders o ON p.orderId = o.id
      SET p.tenantId = o.tenantId
      WHERE p.tenantId IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE cliente_petiscaria_payments
      ADD CONSTRAINT FK_payments_tenants FOREIGN KEY (tenantId)
      REFERENCES cliente_petiscaria_tenants(id)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_payments DROP FOREIGN KEY FK_payments_tenants`);
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_payments DROP COLUMN tenantId`);
  }
}


