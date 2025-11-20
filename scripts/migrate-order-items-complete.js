const mysql = require('mysql2/promise');

async function migrateOrderItems() {
  let connection;
  
  try {
    // Configuração da conexão
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'petiscaria_thay',
      multipleStatements: true
    };

    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados');

    // Verificar se as colunas já existem
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${config.database}' 
      AND TABLE_NAME = 'cliente_gp_order_items'
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Colunas existentes:', existingColumns);

    // Lista de colunas que precisam ser adicionadas
    const columnsToAdd = [
      {
        name: 'status',
        definition: 'ADD COLUMN `status` varchar(50) NOT NULL DEFAULT \'pending\''
      },
      {
        name: 'startTime',
        definition: 'ADD COLUMN `startTime` timestamp NULL DEFAULT NULL'
      },
      {
        name: 'endTime',
        definition: 'ADD COLUMN `endTime` timestamp NULL DEFAULT NULL'
      },
      {
        name: 'sentToKitchenAt',
        definition: 'ADD COLUMN `sentToKitchenAt` timestamp NULL DEFAULT NULL'
      }
    ];

    // Adicionar colunas que não existem
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adicionando coluna: ${column.name}`);
        await connection.execute(`
          ALTER TABLE \`cliente_gp_order_items\` 
          ${column.definition}
        `);
        console.log(`✅ Coluna ${column.name} adicionada`);
      } else {
        console.log(`ℹ️ Coluna ${column.name} já existe`);
      }
    }

    // Verificar se os índices existem
    const [indexes] = await connection.execute(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = '${config.database}' 
      AND TABLE_NAME = 'cliente_gp_order_items'
    `);

    const existingIndexes = indexes.map(idx => idx.INDEX_NAME);
    console.log('🔍 Índices existentes:', existingIndexes);

    // Adicionar índices que não existem
    const indexesToAdd = [
      {
        name: 'idx_status',
        definition: 'ADD INDEX `idx_status` (`status`)'
      },
      {
        name: 'idx_is_ready',
        definition: 'ADD INDEX `idx_is_ready` (`isReady`)'
      }
    ];

    for (const index of indexesToAdd) {
      if (!existingIndexes.includes(index.name)) {
        console.log(`➕ Adicionando índice: ${index.name}`);
        await connection.execute(`
          ALTER TABLE \`cliente_gp_order_items\` 
          ${index.definition}
        `);
        console.log(`✅ Índice ${index.name} adicionado`);
      } else {
        console.log(`ℹ️ Índice ${index.name} já existe`);
      }
    }

    // Verificar estrutura final
    const [finalColumns] = await connection.execute(`
      DESCRIBE \`cliente_gp_order_items\`
    `);

    console.log('\n📊 Estrutura final da tabela:');
    finalColumns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra}`);
    });

    console.log('\n🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar migração
if (require.main === module) {
  migrateOrderItems()
    .then(() => {
      console.log('✅ Migração finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = { migrateOrderItems };
