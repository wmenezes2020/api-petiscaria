DROP TABLE IF EXISTS `cliente_gp_suppliers`;
CREATE TABLE IF NOT EXISTS `cliente_gp_suppliers` (
  `id` varchar(36) NOT NULL,
  `tenantId` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contactName` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `cnpj` varchar(18) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zipCode` varchar(10) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active' COMMENT 'active, inactive',
  `notes` text,
  `companyId` varchar(36) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_suppliers_cnpj_companyId` (`cnpj`,`companyId`),
  UNIQUE KEY `IDX_suppliers_email_companyId` (`email`,`companyId`),
  KEY `IDX_suppliers_companyId` (`companyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
