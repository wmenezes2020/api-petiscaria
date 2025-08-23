CREATE TABLE IF NOT EXISTS `cliente_petiscaria_modifier_options` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `modifierGroupId` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_modifier_options_modifierGroupId` (`modifierGroupId`),
  CONSTRAINT `FK_modifier_options_modifierGroupId` FOREIGN KEY (`modifierGroupId`) REFERENCES `cliente_petiscaria_modifier_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
