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
      AND table_name = 'cliente_gp_locations'
    `);

    if (locationsTable[0].count === 0) {
      console.log('➕ Criando tabela cliente_gp_locations...');
      await connection.execute(`
                 CREATE TABLE \`cliente_gp_locations\` (
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
        SELECT id, name FROM \`cliente_gp_companies\`
      `);

      for (const company of companies) {
        const locationId = require('crypto').randomUUID();
        await connection.execute(`
          INSERT INTO \`cliente_gp_locations\` (id, name, companyId) 
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
      AND table_name = 'cliente_gp_areas'
    `);

    if (areasTable[0].count === 0) {
      console.log('➕ Criando tabela cliente_gp_areas...');
      await connection.execute(`
                 CREATE TABLE \`cliente_gp_areas\` (
           \`id\` varchar(36) NOT NULL,
           \`name\` varchar(255) NOT NULL,
           \`description\` text,
           \`companyId\` varchar(36) NOT NULL,
           \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
           \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
           PRIMARY KEY (\`id\`),
           KEY \`IDX_areas_companyId\` (\`companyId\`)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tabela areas criada');

      // Criar uma área padrão para cada empresa
      const [companies] = await connection.execute(`
        SELECT id FROM \`cliente_gp_companies\`
      `);

      for (const company of companies) {
        // Verificar se já existe área para esta empresa
        const [existingAreas] = await connection.execute(`
          SELECT id FROM \`cliente_gp_areas\` WHERE companyId = ?
        `, [company.id]);

        if (existingAreas.length === 0) {
          const areaId = require('crypto').randomUUID();
          await connection.execute(`
            INSERT INTO \`cliente_gp_areas\` (id, name, description, companyId) 
            VALUES (?, ?, ?, ?)
          `, [areaId, 'Área Principal', 'Área principal do estabelecimento', company.id]);
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
        AND TABLE_NAME = 'cliente_gp_areas'
      `);

      const existingColumns = columns.map(col => col.COLUMN_NAME);
      
      // REMOVIDO: A relação entre Areas e Locations foi removida.
      // Areas agora pertencem apenas a Companies (não a Locations/Filiais).
      // Se a coluna locationId ainda existir, deve ser removida pela migração remove-locationid-from-areas.sql
      
      if (existingColumns.includes('locationId')) {
        console.log('⚠️ Coluna locationId ainda existe na tabela areas.');
        console.log('⚠️ Execute a migração remove-locationid-from-areas.sql para removê-la.');
      } else {
        console.log('✅ Tabela areas está atualizada (sem locationId)');
      }
    }

    // 3. Verificar estrutura final
    console.log('\n📊 Estrutura final das tabelas:');
    
    const [areasStructure] = await connection.execute(`
      DESCRIBE \`cliente_gp_areas\`
    `);
    console.log('\n🏠 Tabela areas:');
    areasStructure.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra}`);
    });

    const [locationsStructure] = await connection.execute(`
      DESCRIBE \`cliente_gp_locations\`
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
