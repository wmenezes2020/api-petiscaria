const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixCompaniesTable() {
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

    // Verificar se a tabela companies existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'cliente_petiscaria_companies'
    `);

    if (tables.length === 0) {
      console.log('📝 Tabela companies não existe. Criando...');
      
      // Criar a tabela companies
      await connection.execute(`
        CREATE TABLE cliente_petiscaria_companies (
          id varchar(36) NOT NULL,
          fantasia varchar(255) NOT NULL,
          razao_social varchar(255) NOT NULL,
          documento varchar(255) NOT NULL,
          pix_config json DEFAULT NULL,
          timezone varchar(255) DEFAULT NULL,
          active tinyint NOT NULL DEFAULT '1',
          created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (id),
          UNIQUE KEY IDX_documento (documento)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Tabela companies criada com sucesso!');
    } else {
      console.log('✅ Tabela companies já existe');
      
      // Verificar a estrutura da tabela
      const [columns] = await connection.execute('DESCRIBE cliente_petiscaria_companies');
      console.log('📋 Estrutura atual da tabela companies:');
      columns.forEach(col => {
        console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
      });

      // Verificar se a coluna fantasia existe
      const hasFantasia = columns.some(col => col.Field === 'fantasia');
      
      if (!hasFantasia) {
        console.log('📝 Coluna fantasia não existe. Adicionando...');
        
        // Adicionar a coluna fantasia
        await connection.execute(`
          ALTER TABLE cliente_petiscaria_companies 
          ADD COLUMN fantasia varchar(255) NOT NULL AFTER id
        `);
        
        console.log('✅ Coluna fantasia adicionada com sucesso!');
      } else {
        console.log('✅ Coluna fantasia já existe');
      }

      // Verificar se a coluna razao_social existe
      const hasRazaoSocial = columns.some(col => col.Field === 'razao_social');
      
      if (!hasRazaoSocial) {
        console.log('📝 Coluna razao_social não existe. Adicionando...');
        
        // Adicionar a coluna razao_social
        await connection.execute(`
          ALTER TABLE cliente_petiscaria_companies 
          ADD COLUMN razao_social varchar(255) NOT NULL AFTER fantasia
        `);
        
        console.log('✅ Coluna razao_social adicionada com sucesso!');
      } else {
        console.log('✅ Coluna razao_social já existe');
      }

      // Verificar se a coluna documento existe
      const hasDocumento = columns.some(col => col.Field === 'documento');
      
      if (!hasDocumento) {
        console.log('📝 Coluna documento não existe. Adicionando...');
        
        // Adicionar a coluna documento
        await connection.execute(`
          ALTER TABLE cliente_petiscaria_companies 
          ADD COLUMN documento varchar(255) NOT NULL AFTER razao_social
        `);
        
        console.log('✅ Coluna documento adicionada com sucesso!');
      } else {
        console.log('✅ Coluna documento já existe');
      }

      // Verificar se a coluna pix_config existe
      const hasPixConfig = columns.some(col => col.Field === 'pix_config');
      
      if (!hasPixConfig) {
        console.log('📝 Coluna pix_config não existe. Adicionando...');
        
        // Adicionar a coluna pix_config
        await connection.execute(`
          ALTER TABLE cliente_petiscaria_companies 
          ADD COLUMN pix_config json DEFAULT NULL AFTER documento
        `);
        
        console.log('✅ Coluna pix_config adicionada com sucesso!');
      } else {
        console.log('✅ Coluna pix_config já existe');
      }

      // Verificar se a coluna timezone existe
      const hasTimezone = columns.some(col => col.Field === 'timezone');
      
      if (!hasTimezone) {
        console.log('📝 Coluna timezone não existe. Adicionando...');
        
        // Adicionar a coluna timezone
        await connection.execute(`
          ALTER TABLE cliente_petiscaria_companies 
          ADD COLUMN timezone varchar(255) DEFAULT NULL AFTER pix_config
        `);
        
        console.log('✅ Coluna timezone adicionada com sucesso!');
      } else {
        console.log('✅ Coluna timezone já existe');
      }

      // Verificar se a coluna active existe
      const hasActive = columns.some(col => col.Field === 'active');
      
      if (!hasActive) {
        console.log('📝 Coluna active não existe. Adicionando...');
        
        // Adicionar a coluna active
        await connection.execute(`
          ALTER TABLE cliente_petiscaria_companies 
          ADD COLUMN active tinyint NOT NULL DEFAULT '1' AFTER timezone
        `);
        
        console.log('✅ Coluna active adicionada com sucesso!');
      } else {
        console.log('✅ Coluna active já existe');
      }

      // Verificar se a coluna created_at existe
      const hasCreatedAt = columns.some(col => col.Field === 'created_at');
      
      if (!hasCreatedAt) {
        console.log('📝 Coluna created_at não existe. Adicionando...');
        
        // Adicionar a coluna created_at
        await connection.execute(`
          ALTER TABLE cliente_petiscaria_companies 
          ADD COLUMN created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) AFTER active
        `);
        
        console.log('✅ Coluna created_at adicionada com sucesso!');
      } else {
        console.log('✅ Coluna created_at já existe');
      }

      // Verificar se a coluna updated_at existe
      const hasUpdatedAt = columns.some(col => col.Field === 'updated_at');
      
      if (!hasUpdatedAt) {
        console.log('📝 Coluna updated_at não existe. Adicionando...');
        
        // Adicionar a coluna updated_at
        await connection.execute(`
          ALTER TABLE cliente_petiscaria_companies 
          ADD COLUMN updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) AFTER created_at
        `);
        
        console.log('✅ Coluna updated_at adicionada com sucesso!');
      } else {
        console.log('✅ Coluna updated_at já existe');
      }
    }

    // Verificar a estrutura final da tabela
    const [finalColumns] = await connection.execute('DESCRIBE cliente_petiscaria_companies');
    console.log('\n📋 Estrutura final da tabela companies:');
    finalColumns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });

    console.log('\n✅ Tabela companies corrigida com sucesso!');

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

fixCompaniesTable().catch(console.error);
