-- Criação da tabela de categorias (categories)
DROP TABLE IF EXISTS `cliente_gp_categories`;
CREATE TABLE IF NOT EXISTS `cliente_gp_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `sortOrder` int DEFAULT 0,
  `isActive` boolean DEFAULT true,
  `isFeatured` boolean DEFAULT false,
  `icon` varchar(50) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `companyId` char(36) NOT NULL,
  `locationId` char(36) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_name_locationId` (`name`, `locationId`),
  KEY `IDX_companyId` (`companyId`),
  KEY `IDX_locationId` (`locationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
