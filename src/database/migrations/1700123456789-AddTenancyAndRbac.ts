import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenancyAndRbac1700123456789 implements MigrationInterface {
  name = 'AddTenancyAndRbac1700123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cliente_gp_tenants (
        id char(36) NOT NULL PRIMARY KEY,
        name varchar(255) NOT NULL,
        legalName varchar(255) NULL,
        document varchar(20) NULL,
        primaryEmail varchar(255) NULL,
        primaryPhone varchar(20) NULL,
        status varchar(20) NOT NULL DEFAULT 'active',
        plan varchar(50) NOT NULL DEFAULT 'basic',
        planExpiresAt datetime NULL,
        billingInfo json NULL,
        configPix json NULL,
        settings json NULL,
        timezone varchar(64) NULL,
        isActive tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      )
    `);

    await queryRunner.query(`ALTER TABLE cliente_gp_companies ADD tenantId char(36) NULL`);
    await queryRunner.query(`ALTER TABLE cliente_gp_users ADD tenantId char(36) NULL`);
    await queryRunner.query(`ALTER TABLE cliente_gp_users ADD roleId char(36) NULL`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cliente_gp_tenant_users (
        id char(36) NOT NULL PRIMARY KEY,
        tenantId char(36) NOT NULL,
        userId char(36) NOT NULL,
        roles text NULL,
        metadata json NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY UK_tenant_user (tenantId, userId)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cliente_gp_permissions (
        id char(36) NOT NULL PRIMARY KEY,
        \`key\` varchar(255) NOT NULL UNIQUE,
        resource varchar(120) NOT NULL,
        action varchar(120) NOT NULL,
        description varchar(255) NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cliente_gp_roles (
        id char(36) NOT NULL PRIMARY KEY,
        tenantId char(36) NULL,
        \`key\` varchar(120) NOT NULL,
        name varchar(255) NOT NULL,
        description varchar(255) NULL,
        isSystem tinyint NOT NULL DEFAULT 0,
        isActive tinyint NOT NULL DEFAULT 1,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY UK_role_key_tenant (\`key\`, tenantId)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cliente_gp_role_permissions (
        roleId char(36) NOT NULL,
        permissionId char(36) NOT NULL,
        PRIMARY KEY (roleId, permissionId)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cliente_gp_user_tokens (
        id char(36) NOT NULL PRIMARY KEY,
        userId char(36) NOT NULL,
        tenantId char(36) NULL,
        tokenHash varchar(500) NOT NULL,
        userAgent varchar(255) NULL,
        ipAddress varchar(45) NULL,
        expiresAt datetime NOT NULL,
        revokedAt datetime NULL,
        metadata json NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS cliente_gp_user_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS cliente_gp_role_permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS cliente_gp_roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS cliente_gp_permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS cliente_gp_tenant_users`);
    await queryRunner.query(`ALTER TABLE cliente_gp_users DROP COLUMN tenantId`);
    await queryRunner.query(`ALTER TABLE cliente_gp_users DROP COLUMN roleId`);
    await queryRunner.query(`ALTER TABLE cliente_gp_companies DROP COLUMN tenantId`);
    await queryRunner.query(`DROP TABLE IF EXISTS cliente_gp_tenants`);
  }
}


