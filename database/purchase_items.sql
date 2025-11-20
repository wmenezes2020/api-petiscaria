DROP TABLE IF EXISTS `cliente_gp_purchase_items`;
CREATE TABLE IF NOT EXISTS `cliente_gp_purchase_items` (
  `id` varchar(36) NOT NULL,
  `purchaseId` varchar(36) NOT NULL,
  `ingredientId` varchar(36) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unitPrice` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_purchase_items_purchaseId` (`purchaseId`),
  KEY `FK_purchase_items_ingredientId` (`ingredientId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
