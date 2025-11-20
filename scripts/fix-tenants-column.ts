import dataSource from '../typeorm.config';

async function main() {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    const hasColumn = await dataSource.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'cliente_gp_tenants'
        AND COLUMN_NAME = 'configPic'
    `);

    if (hasColumn.length) {
      await dataSource.query(`
        ALTER TABLE cliente_gp_tenants
        CHANGE COLUMN configPic configPix json NULL
      `);
      console.log('Coluna configPic renomeada para configPix.');
    } else {
      console.log('Coluna configPic não encontrada, nenhuma alteração necessária.');
    }
  } catch (error) {
    console.error('Erro ao ajustar tabela de tenants:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main();

