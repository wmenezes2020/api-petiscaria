CREATE TABLE IF NOT EXISTS `cliente_petiscaria_purchases` (
  `id` varchar(36) NOT NULL,
  `supplierId` varchar(36) NOT NULL,
  `purchaseDate` date NOT NULL,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `totalAmount` decimal(10,2) NOT NULL,
  `notes` text,
  `companyId` varchar(36) NOT NULL,
  `locationId` varchar(36) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_purchases_companyId_status` (`companyId`,`status`),
  KEY `IDX_purchases_locationId_status` (`locationId`,`status`),
  KEY `FK_purchases_supplierId` (`supplierId`),
  CONSTRAINT `FK_purchases_companyId` FOREIGN KEY (`companyId`) REFERENCES `cliente_petiscaria_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_purchases_locationId` FOREIGN KEY (`locationId`) REFERENCES `cliente_petiscaria_locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_purchases_supplierId` FOREIGN KEY (`supplierId`) REFERENCES `cliente_petiscaria_suppliers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
