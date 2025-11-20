DROP TABLE IF EXISTS `cliente_gp_product_modifier_groups`;
CREATE TABLE IF NOT EXISTS `cliente_gp_product_modifier_groups` (
  `productId` varchar(36) NOT NULL,
  `modifierGroupId` varchar(36) NOT NULL,
  PRIMARY KEY (`productId`,`modifierGroupId`),
  KEY `IDX_product_modifier_groups_productId` (`productId`),
  KEY `IDX_product_modifier_groups_modifierGroupId` (`modifierGroupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
