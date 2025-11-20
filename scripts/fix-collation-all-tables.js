const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
  host: 'db-production.wesleymenezes.com.br',
  port: 3306,
  user: 'root',
  password: '@Jhon2022',
  database: 'wesleyme_eden',
  charset: 'utf8mb4'
};

async function fixCollationForAllTables() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conectado com sucesso!');
    
    // Lista de todas as tabelas do projeto
    const tables = [
      'cliente_gp_companies',
      'cliente_gp_users',
      'cliente_gp_locations',
      'cliente_gp_areas',
      'cliente_gp_tables',
      'cliente_gp_categories',
      'cliente_gp_products',
      'cliente_gp_ingredients',
      'cliente_gp_orders',
      'cliente_gp_order_items',
      'cliente_gp_payments',
      'cliente_gp_cash_registers',
      'cliente_gp_cash_movements',
      'cliente_gp_suppliers',
      'cliente_gp_purchases',
      'cliente_gp_purchase_items',
      'cliente_gp_stock_movements',
      'cliente_gp_recipes',
      'cliente_gp_modifier_groups',
      'cliente_gp_modifier_options',
      'cliente_gp_product_modifier_groups',
      'cliente_gp_notifications',
      'cliente_gp_audit_logs',
      'cliente_gp_tables'
    ];
    
    console.log(`\n🔧 Corrigindo collation para ${tables.length} tabelas...`);
    
    for (const table of tables) {
      try {
        // Verificar se a tabela existe
        const [rows] = await connection.execute(
          `SHOW TABLES LIKE '${table}'`
        );
        
        if (rows.length === 0) {
          console.log(`⚠️  Tabela ${table} não existe, pulando...`);
          continue;
        }
        
        // Verificar collation atual
        const [tableInfo] = await connection.execute(
          `SHOW TABLE STATUS WHERE Name = '${table}'`
        );
        
        if (tableInfo.length > 0) {
          const currentCollation = tableInfo[0].Collation;
          console.log(`📋 ${table}: collation atual = ${currentCollation}`);
          
          if (currentCollation !== 'utf8mb4_unicode_ci') {
            // Alterar collation da tabela
            await connection.execute(
              `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
            );
            console.log(`✅ ${table}: collation alterada para utf8mb4_unicode_ci`);
          } else {
            console.log(`✅ ${table}: já está com collation correta`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Erro ao processar tabela ${table}:`, error.message);
      }
    }
    
    console.log('\n🎯 Verificando collation do banco de dados...');
    
    // Verificar collation do banco
    const [dbInfo] = await connection.execute(
      'SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbConfig.database]
    );
    
    if (dbInfo.length > 0) {
      console.log(`📊 Banco: ${dbInfo[0].DEFAULT_CHARACTER_SET_NAME} / ${dbInfo[0].DEFAULT_COLLATION_NAME}`);
      
      if (dbInfo[0].DEFAULT_COLLATION_NAME !== 'utf8mb4_unicode_ci') {
        console.log('⚠️  Collation do banco diferente, mas isso não afeta as tabelas existentes');
      }
    }
    
    console.log('\n🎉 Processo de correção de collation concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar o script
fixCollationForAllTables().catch(console.error);
