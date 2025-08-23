CREATE TABLE IF NOT EXISTS `cliente_petiscaria_modifier_groups` (
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
  KEY `IDX_modifier_groups_locationId` (`locationId`),
  CONSTRAINT `FK_modifier_groups_companyId` FOREIGN KEY (`companyId`) REFERENCES `cliente_petiscaria_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_modifier_groups_locationId` FOREIGN KEY (`locationId`) REFERENCES `cliente_petiscaria_locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
