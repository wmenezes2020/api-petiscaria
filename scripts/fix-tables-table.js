const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTablesTable() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME || 'petiscaria_user',
      password: process.env.DB_PASSWORD || 'petiscaria_password',
      database: process.env.DB_DATABASE || 'petiscaria_db',
    });

    console.log('🔌 Conectado ao banco de dados');

    // Verificar se as colunas x e y existem
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'cliente_petiscaria_tables'
      AND COLUMN_NAME IN ('x', 'y', 'xPosition', 'yPosition')
    `, [process.env.DB_DATABASE || 'petiscaria_db']);

    console.log('📋 Colunas encontradas:', columns.map(c => c.COLUMN_NAME));

    // Se não existir x e y, criar
    if (!columns.find(c => c.COLUMN_NAME === 'x')) {
      console.log('➕ Adicionando coluna x...');
      await connection.execute(`
        ALTER TABLE cliente_petiscaria_tables 
        ADD COLUMN x DECIMAL(5,2) NOT NULL DEFAULT 0.00
      `);
    }

    if (!columns.find(c => c.COLUMN_NAME === 'y')) {
      console.log('➕ Adicionando coluna y...');
      await connection.execute(`
        ALTER TABLE cliente_petiscaria_tables 
        ADD COLUMN y DECIMAL(5,2) NOT NULL DEFAULT 0.00
      `);
    }

    // Se existir xPosition e yPosition, copiar dados e remover
    if (columns.find(c => c.COLUMN_NAME === 'xPosition')) {
      console.log('📋 Copiando dados de xPosition para x...');
      await connection.execute(`
        UPDATE cliente_petiscaria_tables 
        SET x = xPosition 
        WHERE xPosition IS NOT NULL
      `);
      
      console.log('🗑️ Removendo coluna xPosition...');
      await connection.execute(`
        ALTER TABLE cliente_petiscaria_tables 
        DROP COLUMN xPosition
      `);
    }

    if (columns.find(c => c.COLUMN_NAME === 'yPosition')) {
      console.log('📋 Copiando dados de yPosition para y...');
      await connection.execute(`
        UPDATE cliente_petiscaria_tables 
        SET y = yPosition 
        WHERE yPosition IS NOT NULL
      `);
      
      console.log('🗑️ Removendo coluna yPosition...');
      await connection.execute(`
        ALTER TABLE cliente_petiscaria_tables 
        DROP COLUMN yPosition
      `);
    }

    // Verificar estrutura final
    const [finalColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'cliente_petiscaria_tables'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_DATABASE || 'petiscaria_db']);

    console.log('\n✅ Estrutura final da tabela:');
    finalColumns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${col.COLUMN_DEFAULT ? `DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
    });

    console.log('\n🎉 Tabela tables corrigida com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar o script
fixTablesTable()
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na execução:', error);
    process.exit(1);
  });
