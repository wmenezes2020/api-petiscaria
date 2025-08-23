CREATE TABLE IF NOT EXISTS `cliente_petiscaria_supplier_locations` (
  `supplierId` varchar(36) NOT NULL,
  `locationId` varchar(36) NOT NULL,
  PRIMARY KEY (`supplierId`,`locationId`),
  KEY `IDX_supplier_locations_supplierId` (`supplierId`),
  KEY `IDX_supplier_locations_locationId` (`locationId`),
  CONSTRAINT `FK_supplier_locations_supplierId` FOREIGN KEY (`supplierId`) REFERENCES `cliente_petiscaria_suppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_supplier_locations_locationId` FOREIGN KEY (`locationId`) REFERENCES `cliente_petiscaria_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
