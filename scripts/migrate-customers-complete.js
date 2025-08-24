const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

async function migrateCustomers() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar se a tabela existe
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'cliente_petiscaria_customers'"
    );
    
    if (tables.length === 0) {
      console.log('📋 Tabela não existe, criando tabela completa...');
      
      // Criar tabela completa
      const createTableSQL = `
        CREATE TABLE \`cliente_petiscaria_customers\` (
          \`id\` varchar(36) NOT NULL,
          \`name\` varchar(255) NOT NULL,
          \`email\` varchar(255) DEFAULT NULL,
          \`phone\` varchar(20) DEFAULT NULL,
          \`cpf\` varchar(14) DEFAULT NULL,
          \`cnpj\` varchar(18) DEFAULT NULL,
          \`type\` varchar(50) NOT NULL DEFAULT 'individual',
          \`status\` varchar(50) NOT NULL DEFAULT 'active',
          \`notes\` text DEFAULT NULL,
          \`address\` varchar(255) DEFAULT NULL,
          \`city\` varchar(100) DEFAULT NULL,
          \`state\` varchar(2) DEFAULT NULL,
          \`zipCode\` varchar(10) DEFAULT NULL,
          \`birthDate\` date DEFAULT NULL,
          \`avatar\` varchar(255) DEFAULT NULL,
          \`totalSpent\` decimal(10,2) NOT NULL DEFAULT '0.00',
          \`totalOrders\` int NOT NULL DEFAULT '0',
          \`totalVisits\` int NOT NULL DEFAULT '0',
          \`lastVisitAt\` timestamp NULL DEFAULT NULL,
          \`lastVisitDate\` timestamp NULL DEFAULT NULL,
          \`lastOrderAt\` timestamp NULL DEFAULT NULL,
          \`averageTicket\` decimal(10,2) NOT NULL DEFAULT '0.00',
          \`preferences\` json DEFAULT NULL,
          \`metadata\` json DEFAULT NULL,
          \`companyId\` varchar(36) NOT NULL,
          \`locationId\` varchar(36) DEFAULT NULL,
          \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_email_company\` (\`email\`, \`companyId\`),
          UNIQUE KEY \`uk_cpf_company\` (\`cpf\`, \`companyId\`),
          UNIQUE KEY \`uk_cnpj_company\` (\`cnpj\`, \`companyId\`),
          KEY \`idx_company_id\` (\`companyId\`),
          KEY \`idx_location_id\` (\`locationId\`),
          KEY \`idx_phone_company\` (\`phone\`, \`companyId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      await connection.execute(createTableSQL);
      console.log('✅ Tabela cliente_petiscaria_customers criada com sucesso');
      
    } else {
      console.log('📋 Tabela existe, verificando colunas...');
      
      // Verificar se a coluna notes existe
      const [notesColumn] = await connection.execute(
        "SHOW COLUMNS FROM cliente_petiscaria_customers LIKE 'notes'"
      );
      
      if (notesColumn.length === 0) {
        console.log('➕ Adicionando coluna notes...');
        await connection.execute(
          "ALTER TABLE cliente_petiscaria_customers ADD COLUMN notes text DEFAULT NULL AFTER status"
        );
        console.log('✅ Coluna notes adicionada');
      } else {
        console.log('✅ Coluna notes já existe');
      }
      
      // Verificar se a coluna lastVisitDate existe
      const [lastVisitDateColumn] = await connection.execute(
        "SHOW COLUMNS FROM cliente_petiscaria_customers LIKE 'lastVisitDate'"
      );
      
      if (lastVisitDateColumn.length === 0) {
        console.log('➕ Adicionando coluna lastVisitDate...');
        await connection.execute(
          "ALTER TABLE cliente_petiscaria_customers ADD COLUMN lastVisitDate timestamp NULL DEFAULT NULL AFTER lastVisitAt"
        );
        console.log('✅ Coluna lastVisitDate adicionada');
      } else {
        console.log('✅ Coluna lastVisitDate já existe');
      }
    }
    
    console.log('🎉 Migração de customers concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar migração
migrateCustomers()
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error);
    process.exit(1);
  });

