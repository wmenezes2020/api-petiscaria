const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCompaniesStructure() {
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

    // Verificar a estrutura da tabela companies
    const [columns] = await connection.execute('DESCRIBE cliente_gp_companies');
    console.log('📋 Estrutura atual da tabela companies:');
    columns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });

    // Verificar se há colunas obrigatórias sem valor padrão
    const requiredColumns = columns.filter(col => col.Null === 'NO' && col.Default === null);
    if (requiredColumns.length > 0) {
      console.log('\n⚠️  Colunas obrigatórias sem valor padrão:');
      requiredColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
    }

    // Verificar se há colunas que podem ser NULL
    const nullableColumns = columns.filter(col => col.Null === 'YES');
    if (nullableColumns.length > 0) {
      console.log('\n✅ Colunas que podem ser NULL:');
      nullableColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
    }

    // Verificar se há colunas com valor padrão
    const defaultColumns = columns.filter(col => col.Default !== null);
    if (defaultColumns.length > 0) {
      console.log('\n✅ Colunas com valor padrão:');
      defaultColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) = ${col.Default}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

checkCompaniesStructure().catch(console.error);
