-- Migração para adicionar a coluna locationId na tabela users
-- Esta migração é necessária para resolver o erro de coluna inexistente

-- Verificar se a coluna já existe antes de adicionar
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'cliente_petiscaria_users' 
     AND COLUMN_NAME = 'locationId') > 0,
    'SELECT "Coluna locationId já existe na tabela cliente_petiscaria_users" as message',
    'ALTER TABLE cliente_petiscaria_users ADD COLUMN locationId char(36) DEFAULT NULL AFTER companyId'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar índice para a nova coluna (se não existir)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'cliente_petiscaria_users' 
     AND INDEX_NAME = 'IDX_locationId') > 0,
    'SELECT "Índice IDX_locationId já existe na tabela cliente_petiscaria_users" as message',
    'CREATE INDEX IDX_locationId ON cliente_petiscaria_users(locationId)'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar se a coluna foi criada com sucesso
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'cliente_petiscaria_users' 
AND COLUMN_NAME = 'locationId';
