const mysql = require('mysql2/promise');

async function migrateAreasLocations() {
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

    // 1. Verificar se a tabela locations existe
    const [locationsTable] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = '${config.database}' 
      AND table_name = 'cliente_petiscaria_locations'
    `);

    if (locationsTable[0].count === 0) {
      console.log('➕ Criando tabela cliente_petiscaria_locations...');
      await connection.execute(`
                 CREATE TABLE \`cliente_petiscaria_locations\` (
           \`id\` varchar(36) NOT NULL,
           \`name\` varchar(255) NOT NULL,
           \`address\` varchar(255) DEFAULT NULL,
           \`city\` varchar(100) DEFAULT NULL,
           \`state\` varchar(2) DEFAULT NULL,
           \`zipCode\` varchar(10) DEFAULT NULL,
           \`phone\` varchar(20) DEFAULT NULL,
           \`isActive\` boolean NOT NULL DEFAULT true,
           \`companyId\` varchar(36) NOT NULL,
           \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
           \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
           PRIMARY KEY (\`id\`),
           KEY \`IDX_locations_companyId\` (\`companyId\`)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tabela locations criada');

      // Criar uma localização padrão para cada empresa existente
      const [companies] = await connection.execute(`
        SELECT id, name FROM \`cliente_petiscaria_companies\`
      `);

      for (const company of companies) {
        const locationId = require('crypto').randomUUID();
        await connection.execute(`
          INSERT INTO \`cliente_petiscaria_locations\` (id, name, companyId) 
          VALUES (?, ?, ?)
        `, [locationId, `${company.name} - Sede`, company.id]);
        console.log(`📍 Localização padrão criada para empresa: ${company.name}`);
      }
    } else {
      console.log('ℹ️ Tabela locations já existe');
    }

    // 2. Verificar se a tabela areas existe e tem a estrutura correta
    const [areasTable] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = '${config.database}' 
      AND table_name = 'cliente_petiscaria_areas'
    `);

    if (areasTable[0].count === 0) {
      console.log('➕ Criando tabela cliente_petiscaria_areas...');
      await connection.execute(`
                 CREATE TABLE \`cliente_petiscaria_areas\` (
           \`id\` varchar(36) NOT NULL,
           \`name\` varchar(255) NOT NULL,
           \`description\` text,
           \`companyId\` varchar(36) NOT NULL,
           \`locationId\` varchar(36) NOT NULL,
           \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
           \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
           PRIMARY KEY (\`id\`),
           KEY \`IDX_areas_companyId\` (\`companyId\`),
           KEY \`IDX_areas_locationId\` (\`locationId\`)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tabela areas criada');

      // Criar uma área padrão para cada empresa
      const [companies] = await connection.execute(`
        SELECT id FROM \`cliente_petiscaria_companies\`
      `);

      for (const company of companies) {
        const [location] = await connection.execute(`
          SELECT id FROM \`cliente_petiscaria_locations\` WHERE companyId = ?
        `, [company.id]);

        if (location.length > 0) {
          const areaId = require('crypto').randomUUID();
          await connection.execute(`
            INSERT INTO \`cliente_petiscaria_areas\` (id, name, description, companyId, locationId) 
            VALUES (?, ?, ?, ?, ?)
          `, [areaId, 'Área Principal', 'Área principal do estabelecimento', company.id, location[0].id]);
          console.log(`🏠 Área padrão criada para empresa: ${company.id}`);
        }
      }
    } else {
      console.log('ℹ️ Tabela areas já existe');
      
      // Verificar se a coluna locationId existe
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${config.database}' 
        AND TABLE_NAME = 'cliente_petiscaria_areas'
      `);

      const existingColumns = columns.map(col => col.COLUMN_NAME);
      
      if (!existingColumns.includes('locationId')) {
        console.log('➕ Adicionando coluna locationId à tabela areas...');
        
        // Primeiro, obter uma locationId válida
        const [locations] = await connection.execute(`
          SELECT id FROM \`cliente_petiscaria_locations\` LIMIT 1
        `);
        
        if (locations.length > 0) {
          const defaultLocationId = locations[0].id;
          
          await connection.execute(`
            ALTER TABLE \`cliente_petiscaria_areas\` 
            ADD COLUMN \`locationId\` varchar(36) NOT NULL DEFAULT '${defaultLocationId}'
          `);
          
          // Atualizar todas as áreas existentes com a locationId padrão
          await connection.execute(`
            UPDATE \`cliente_petiscaria_areas\` 
            SET \`locationId\` = '${defaultLocationId}'
          `);
          
                     // Foreign Keys removidos conforme solicitado
          
          // Adicionar o índice
          await connection.execute(`
            ALTER TABLE \`cliente_petiscaria_areas\` 
            ADD INDEX \`IDX_areas_locationId\` (\`locationId\`)
          `);
          
          console.log('✅ Coluna locationId adicionada e configurada');
        } else {
          console.log('⚠️ Nenhuma localização encontrada para associar às áreas');
        }
      } else {
        console.log('ℹ️ Coluna locationId já existe na tabela areas');
      }
    }

    // 3. Verificar estrutura final
    console.log('\n📊 Estrutura final das tabelas:');
    
    const [areasStructure] = await connection.execute(`
      DESCRIBE \`cliente_petiscaria_areas\`
    `);
    console.log('\n🏠 Tabela areas:');
    areasStructure.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra}`);
    });

    const [locationsStructure] = await connection.execute(`
      DESCRIBE \`cliente_petiscaria_locations\`
    `);
    console.log('\n📍 Tabela locations:');
    locationsStructure.forEach(col => {
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
  migrateAreasLocations()
    .then(() => {
      console.log('✅ Migração finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = { migrateAreasLocations };
