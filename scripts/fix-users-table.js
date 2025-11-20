const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixUsersTable() {
  let connection;
  
  try {
    // Configuração da conexão
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'wesleyme_eden'
    });

    console.log('🔌 Conectado ao banco de dados MySQL');

    // Verificar se a coluna locationId já existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'cliente_gp_users' 
      AND COLUMN_NAME = 'locationId'
    `);

    if (columns.length > 0) {
      console.log('✅ Coluna locationId já existe na tabela users');
      return;
    }

    console.log('📝 Adicionando coluna locationId...');
    
    // Adicionar a coluna locationId
    await connection.execute(`
      ALTER TABLE cliente_gp_users 
      ADD COLUMN locationId char(36) DEFAULT NULL AFTER companyId
    `);

    console.log('✅ Coluna locationId adicionada com sucesso!');

    // Adicionar índice
    console.log('📝 Criando índice...');
    await connection.execute(`
      CREATE INDEX IDX_locationId ON cliente_gp_users(locationId)
    `);

    console.log('✅ Índice criado com sucesso!');

    // Verificar a estrutura da tabela
    const [tableStructure] = await connection.execute('DESCRIBE cliente_gp_users');
    console.log('📋 Estrutura atual da tabela users:');
    tableStructure.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  A coluna já existe');
    } else if (error.code === 'ER_DUP_KEYNAME') {
      console.log('ℹ️  O índice já existe');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

fixUsersTable().catch(console.error);
