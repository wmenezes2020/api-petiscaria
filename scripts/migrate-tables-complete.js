const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateTablesComplete() {
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

    // Verificar se a tabela existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'cliente_petiscaria_tables'
    `, [process.env.DB_DATABASE || 'petiscaria_db']);

    if (tables.length === 0) {
      console.log('📋 Tabela não existe, criando...');
      await connection.execute(`
        CREATE TABLE cliente_petiscaria_tables (
          id varchar(36) NOT NULL,
          number varchar(10) NOT NULL,
          name varchar(255) DEFAULT NULL,
          status varchar(50) NOT NULL DEFAULT 'available',
          shape varchar(50) NOT NULL DEFAULT 'round',
          capacity int NOT NULL DEFAULT '2',
          minCapacity int NOT NULL DEFAULT '0',
          maxCapacity int NOT NULL DEFAULT '0',
          x decimal(5,2) NOT NULL DEFAULT '0.00',
          y decimal(5,2) NOT NULL DEFAULT '0.00',
          sortOrder int NOT NULL DEFAULT '0',
          isActive boolean NOT NULL DEFAULT true,
          isReservable boolean NOT NULL DEFAULT false,
          isSmoking boolean NOT NULL DEFAULT false,
          isOutdoor boolean NOT NULL DEFAULT false,
          color varchar(7) DEFAULT NULL,
          description varchar(255) DEFAULT NULL,
          features json DEFAULT NULL,
          metadata json DEFAULT NULL,
          minimumOrder decimal(10,2) NOT NULL DEFAULT '0.00',
          currentOrderId varchar(36) DEFAULT NULL,
          currentCustomerCount int NOT NULL DEFAULT '0',
          openedAt timestamp NULL DEFAULT NULL,
          companyId varchar(36) NOT NULL,
          locationId varchar(36) DEFAULT NULL,
          areaId varchar(36) DEFAULT NULL,
          createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uk_number_location (number, locationId),
          KEY idx_company_id (companyId),
          KEY idx_location_id (locationId),
          KEY idx_area_id (areaId),
          KEY idx_status (status),
          KEY idx_current_order (currentOrderId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tabela criada com sucesso');
    } else {
      console.log('📋 Tabela já existe, verificando estrutura...');
      
      // Verificar colunas existentes
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'cliente_petiscaria_tables'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_DATABASE || 'petiscaria_db']);

      console.log('📋 Colunas existentes:', columns.map(c => c.COLUMN_NAME));

      // Adicionar colunas que faltam
      const requiredColumns = [
        { name: 'minimumOrder', type: 'DECIMAL(10,2) NOT NULL DEFAULT 0.00' },
        { name: 'currentOrderId', type: 'VARCHAR(36) DEFAULT NULL' },
        { name: 'currentCustomerCount', type: 'INT NOT NULL DEFAULT 0' },
        { name: 'openedAt', type: 'TIMESTAMP NULL DEFAULT NULL' }
      ];

      for (const col of requiredColumns) {
        if (!columns.find(c => c.COLUMN_NAME === col.name)) {
          console.log(`➕ Adicionando coluna ${col.name}...`);
          await connection.execute(`
            ALTER TABLE cliente_petiscaria_tables 
            ADD COLUMN ${col.name} ${col.type}
          `);
        }
      }

      // Verificar se as colunas x e y existem
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

      // Remover colunas antigas se existirem
      if (columns.find(c => c.COLUMN_NAME === 'xPosition')) {
        console.log('🗑️ Removendo coluna xPosition...');
        await connection.execute(`
          ALTER TABLE cliente_petiscaria_tables 
          DROP COLUMN xPosition
        `);
      }

      if (columns.find(c => c.COLUMN_NAME === 'yPosition')) {
        console.log('🗑️ Removendo coluna yPosition...');
        await connection.execute(`
          ALTER TABLE cliente_petiscaria_tables 
          DROP COLUMN yPosition
        `);
      }
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

    console.log('\n🎉 Migração da tabela tables concluída com sucesso!');
    console.log('📊 Funcionalidades disponíveis:');
    console.log('  ✅ Posicionamento (x, y) para mapa da sala');
    console.log('  ✅ Pedido mínimo por mesa');
    console.log('  ✅ Controle de pedido atual');
    console.log('  ✅ Contagem de clientes');
    console.log('  ✅ Horário de abertura');
    console.log('  ✅ Metadados e features');
    console.log('  ✅ Relacionamento com áreas');

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

// Executar o script
migrateTablesComplete()
  .then(() => {
    console.log('✅ Script de migração executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na execução:', error);
    process.exit(1);
  });
