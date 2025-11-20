-- Migração simples para adicionar a coluna locationId na tabela users
-- Esta migração resolve o erro "Unknown column 'User.locationId' in 'SELECT'"

-- Adicionar a coluna locationId se ela não existir
ALTER TABLE `cliente_gp_users` 
ADD COLUMN `locationId` char(36) DEFAULT NULL AFTER `companyId`;

-- Adicionar índice para a nova coluna
CREATE INDEX `IDX_locationId` ON `cliente_gp_users`(`locationId`);

-- Verificar se a coluna foi criada
DESCRIBE `cliente_gp_users`;
