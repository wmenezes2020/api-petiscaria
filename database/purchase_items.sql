CREATE TABLE IF NOT EXISTS `cliente_petiscaria_purchase_items` (
  `id` varchar(36) NOT NULL,
  `purchaseId` varchar(36) NOT NULL,
  `ingredientId` varchar(36) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unitPrice` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_purchase_items_purchaseId` (`purchaseId`),
  KEY `FK_purchase_items_ingredientId` (`ingredientId`),
  CONSTRAINT `FK_purchase_items_purchaseId` FOREIGN KEY (`purchaseId`) REFERENCES `cliente_petiscaria_purchases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_purchase_items_ingredientId` FOREIGN KEY (`ingredientId`) REFERENCES `cliente_petiscaria_ingredients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
