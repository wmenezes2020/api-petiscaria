DROP TABLE IF EXISTS `cliente_gp_modifier_options`;
CREATE TABLE IF NOT EXISTS `cliente_gp_modifier_options` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `modifierGroupId` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_modifier_options_modifierGroupId` (`modifierGroupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
