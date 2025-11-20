const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Configuração da conexão com o banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'wesleyme_eden',
      multipleStatements: true
    });

    console.log('🔌 Conectado ao banco de dados MySQL');

    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_locationId_to_users.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📖 Executando migração...');
    
    // Executar a migração
    const [results] = await connection.execute(migrationSQL);
    
    console.log('✅ Migração executada com sucesso!');
    console.log('Resultados:', results);

    // Verificar se a coluna foi criada
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'cliente_gp_users' 
      AND COLUMN_NAME = 'locationId'
    `);

    if (columns.length > 0) {
      console.log('✅ Coluna locationId criada com sucesso:');
      console.log(columns[0]);
    } else {
      console.log('❌ Coluna locationId não foi criada');
    }

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  A coluna locationId já existe na tabela');
    } else if (error.code === 'ER_DUP_KEYNAME') {
      console.log('ℹ️  O índice já existe na tabela');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com o banco fechada');
    }
  }
}

// Executar a migração
runMigration().catch(console.error);
