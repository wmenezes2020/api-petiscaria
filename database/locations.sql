CREATE TABLE IF NOT EXISTS `cliente_petiscaria_locations` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zipCode` varchar(10) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `companyId` varchar(36) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_locations_companyId` (`companyId`),
  CONSTRAINT `FK_locations_companyId` FOREIGN KEY (`companyId`) REFERENCES `cliente_petiscaria_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
