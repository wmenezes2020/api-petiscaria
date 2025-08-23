CREATE TABLE IF NOT EXISTS `cliente_petiscaria_areas` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `companyId` varchar(36) NOT NULL,
  `locationId` varchar(36) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_areas_companyId` (`companyId`),
  KEY `IDX_areas_locationId` (`locationId`),
  CONSTRAINT `FK_areas_companyId` FOREIGN KEY (`companyId`) REFERENCES `cliente_petiscaria_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_areas_locationId` FOREIGN KEY (`locationId`) REFERENCES `cliente_petiscaria_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
