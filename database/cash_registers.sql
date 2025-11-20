-- Estrutura para a tabela `cliente_gp_cash_registers`
DROP TABLE IF EXISTS `cliente_gp_cash_registers`;
CREATE TABLE IF NOT EXISTS `cliente_gp_cash_registers` (
  `id` varchar(36) NOT NULL,
  `tenantId` char(36) NOT NULL,
  `openingBalance` decimal(10,2) NOT NULL,
  `closingBalance` decimal(10,2) DEFAULT NULL,
  `expectedBalance` decimal(10,2) DEFAULT NULL,
  `balanceDifference` decimal(10,2) DEFAULT NULL,
  `openedAt` timestamp NOT NULL,
  `closedAt` timestamp NULL DEFAULT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `openingNotes` text,
  `closingNotes` text,
  `companyId` varchar(36) NOT NULL,
  `openedById` varchar(36) NOT NULL,
  `closedById` varchar(36) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cash_registers_company` (`companyId`),
  KEY `idx_cash_registers_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
