DROP TABLE IF EXISTS `cliente_gp_purchases`;
CREATE TABLE IF NOT EXISTS `cliente_gp_purchases` (
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
  KEY `FK_purchases_supplierId` (`supplierId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
