import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantToStockProductIngredientCustomer1700123600000 implements MigrationInterface {
  name = 'AddTenantToStockProductIngredientCustomer1700123600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar tenantId a stock_movements
    await queryRunner.query(`ALTER TABLE cliente_gp_stock_movements ADD tenantId char(36) NULL`);
    
    // Adicionar tenantId a products
    await queryRunner.query(`ALTER TABLE cliente_gp_products ADD tenantId char(36) NULL`);
    
    // Adicionar tenantId a ingredients
    await queryRunner.query(`ALTER TABLE cliente_gp_ingredients ADD tenantId char(36) NULL`);
    
    // Adicionar tenantId a customers
    await queryRunner.query(`ALTER TABLE cliente_gp_customers ADD tenantId char(36) NULL`);
    
    // Adicionar tenantId a recipes
    await queryRunner.query(`ALTER TABLE cliente_gp_recipes ADD tenantId char(36) NULL`);

    // Backfill: copiar tenantId das companies
    await queryRunner.query(`
      UPDATE cliente_gp_stock_movements sm
      INNER JOIN cliente_gp_companies c ON sm.companyId = c.id
      SET sm.tenantId = c.tenantId
      WHERE sm.tenantId IS NULL
    `);

    await queryRunner.query(`
      UPDATE cliente_gp_products p
      INNER JOIN cliente_gp_companies c ON p.companyId = c.id
      SET p.tenantId = c.tenantId
      WHERE p.tenantId IS NULL
    `);

    await queryRunner.query(`
      UPDATE cliente_gp_ingredients i
      INNER JOIN cliente_gp_companies c ON i.companyId = c.id
      SET i.tenantId = c.tenantId
      WHERE i.tenantId IS NULL
    `);

    await queryRunner.query(`
      UPDATE cliente_gp_customers cu
      INNER JOIN cliente_gp_companies c ON cu.companyId = c.id
      SET cu.tenantId = c.tenantId
      WHERE cu.tenantId IS NULL
    `);

    await queryRunner.query(`
      UPDATE cliente_gp_recipes r
      INNER JOIN cliente_gp_companies c ON r.companyId = c.id
      SET r.tenantId = c.tenantId
      WHERE r.tenantId IS NULL
    `);

    // Tornar tenantId NOT NULL após backfill
    await queryRunner.query(`
      ALTER TABLE cliente_gp_stock_movements
      MODIFY COLUMN tenantId char(36) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE cliente_gp_products
      MODIFY COLUMN tenantId char(36) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE cliente_gp_ingredients
      MODIFY COLUMN tenantId char(36) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE cliente_gp_customers
      MODIFY COLUMN tenantId char(36) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE cliente_gp_recipes
      MODIFY COLUMN tenantId char(36) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cliente_gp_recipes DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE cliente_gp_customers DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE cliente_gp_ingredients DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE cliente_gp_products DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE cliente_gp_stock_movements DROP COLUMN tenantId`);
  }
}

