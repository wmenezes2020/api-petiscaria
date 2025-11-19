import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantToOrdersTables1700123465000 implements MigrationInterface {
  name = 'AddTenantToOrdersTables1700123465000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_orders ADD tenantId char(36) NULL`);
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_order_items ADD tenantId char(36) NULL`);
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_tables ADD tenantId char(36) NULL`);

    await queryRunner.query(`
      UPDATE cliente_petiscaria_orders o
      INNER JOIN cliente_petiscaria_companies c ON o.companyId = c.id
      SET o.tenantId = c.tenantId
      WHERE o.tenantId IS NULL
    `);

    await queryRunner.query(`
      UPDATE cliente_petiscaria_order_items oi
      INNER JOIN cliente_petiscaria_orders o ON oi.orderId = o.id
      SET oi.tenantId = o.tenantId
      WHERE oi.tenantId IS NULL
    `);

    await queryRunner.query(`
      UPDATE cliente_petiscaria_tables t
      INNER JOIN cliente_petiscaria_companies c ON t.companyId = c.id
      SET t.tenantId = c.tenantId
      WHERE t.tenantId IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE cliente_petiscaria_orders
      ADD CONSTRAINT FK_orders_tenants FOREIGN KEY (tenantId)
      REFERENCES cliente_petiscaria_tenants(id)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE cliente_petiscaria_order_items
      ADD CONSTRAINT FK_order_items_tenants FOREIGN KEY (tenantId)
      REFERENCES cliente_petiscaria_tenants(id)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE cliente_petiscaria_tables
      ADD CONSTRAINT FK_tables_tenants FOREIGN KEY (tenantId)
      REFERENCES cliente_petiscaria_tenants(id)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_tables DROP FOREIGN KEY FK_tables_tenants`);
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_order_items DROP FOREIGN KEY FK_order_items_tenants`);
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_orders DROP FOREIGN KEY FK_orders_tenants`);

    await queryRunner.query(`ALTER TABLE cliente_petiscaria_tables DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_order_items DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE cliente_petiscaria_orders DROP COLUMN tenantId`);
  }
}


