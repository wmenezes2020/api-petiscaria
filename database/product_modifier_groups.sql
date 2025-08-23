CREATE TABLE IF NOT EXISTS `cliente_petiscaria_product_modifier_groups` (
  `productId` varchar(36) NOT NULL,
  `modifierGroupId` varchar(36) NOT NULL,
  PRIMARY KEY (`productId`,`modifierGroupId`),
  KEY `IDX_product_modifier_groups_productId` (`productId`),
  KEY `IDX_product_modifier_groups_modifierGroupId` (`modifierGroupId`),
  CONSTRAINT `FK_product_modifier_groups_productId` FOREIGN KEY (`productId`) REFERENCES `cliente_petiscaria_products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_product_modifier_groups_modifierGroupId` FOREIGN KEY (`modifierGroupId`) REFERENCES `cliente_petiscaria_modifier_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
