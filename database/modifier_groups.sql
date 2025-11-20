DROP TABLE IF EXISTS `cliente_gp_modifier_groups`;
CREATE TABLE IF NOT EXISTS `cliente_gp_modifier_groups` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('single','multiple') NOT NULL DEFAULT 'single',
  `minSelection` int DEFAULT NULL,
  `maxSelection` int DEFAULT NULL,
  `companyId` varchar(36) NOT NULL,
  `locationId` varchar(36) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_modifier_groups_companyId` (`companyId`),
  KEY `IDX_modifier_groups_locationId` (`locationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
