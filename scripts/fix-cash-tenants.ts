import dataSource from '../typeorm.config';

async function columnExists(table: string, column: string) {
  const result = await dataSource.query(
    `
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
  `,
    [table, column],
  );
  return result.length > 0;
}

async function constraintExists(table: string, constraint: string) {
  const result = await dataSource.query(
    `
    SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND CONSTRAINT_NAME = ?
  `,
    [table, constraint],
  );
  return result.length > 0;
}

async function ensureColumn(table: string, columnDef: string) {
  const [columnName] = columnDef.split(' ');
  if (!(await columnExists(table, columnName))) {
    await dataSource.query(`ALTER TABLE ${table} ADD ${columnDef}`);
    console.log(`Coluna ${columnName} criada em ${table}`);
  } else {
    console.log(`Coluna ${columnName} já existe em ${table}`);
  }
}

async function ensureForeignKey(
  table: string,
  constraintName: string,
  sql: string,
) {
  if (await constraintExists(table, constraintName)) {
    console.log(`Constraint ${constraintName} já existe em ${table}`);
    return;
  }
  await dataSource.query(sql);
  console.log(`Constraint ${constraintName} criada em ${table}`);
}

async function main() {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Garantir colunas tenantId
    await ensureColumn(
      'cliente_petiscaria_cash_registers',
      'tenantId char(36) NULL',
    );
    await ensureColumn(
      'cliente_petiscaria_cash_movements',
      'tenantId char(36) NULL',
    );

    // Preencher tenantId com base na company/registro
    await dataSource.query(`
      UPDATE cliente_petiscaria_cash_registers cr
      INNER JOIN cliente_petiscaria_companies c ON cr.companyId = c.id
      SET cr.tenantId = c.tenantId
      WHERE cr.tenantId IS NULL OR cr.tenantId = ''
    `);

    await dataSource.query(`
      UPDATE cliente_petiscaria_cash_movements cm
      INNER JOIN cliente_petiscaria_cash_registers cr ON cm.cashRegisterId = cr.id
      SET cm.tenantId = cr.tenantId
      WHERE cm.tenantId IS NULL OR cm.tenantId = ''
    `);

    // Garantir constraints
    await ensureForeignKey(
      'cliente_petiscaria_cash_registers',
      'FK_cash_registers_tenants',
      `
        ALTER TABLE cliente_petiscaria_cash_registers
        ADD CONSTRAINT FK_cash_registers_tenants
        FOREIGN KEY (tenantId)
        REFERENCES cliente_petiscaria_tenants(id)
        ON DELETE CASCADE ON UPDATE NO ACTION
      `,
    );

    await ensureForeignKey(
      'cliente_petiscaria_cash_movements',
      'FK_cash_movements_tenants',
      `
        ALTER TABLE cliente_petiscaria_cash_movements
        ADD CONSTRAINT FK_cash_movements_tenants
        FOREIGN KEY (tenantId)
        REFERENCES cliente_petiscaria_tenants(id)
        ON DELETE CASCADE ON UPDATE NO ACTION
      `,
    );

    // Tornar NOT NULL
    await dataSource.query(`
      ALTER TABLE cliente_petiscaria_cash_registers
      MODIFY COLUMN tenantId char(36) NOT NULL
    `);
    await dataSource.query(`
      ALTER TABLE cliente_petiscaria_cash_movements
      MODIFY COLUMN tenantId char(36) NOT NULL
    `);

    console.log('Ajustes de tenantId em caixa realizados.');
  } catch (error) {
    console.error('Erro ao ajustar tabelas de caixa:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main();

