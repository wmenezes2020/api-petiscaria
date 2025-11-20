DROP TABLE IF EXISTS `cliente_gp_supplier_locations`;
CREATE TABLE IF NOT EXISTS `cliente_gp_supplier_locations` (
  `supplierId` varchar(36) NOT NULL,
  `locationId` varchar(36) NOT NULL,
  PRIMARY KEY (`supplierId`,`locationId`),
  KEY `IDX_supplier_locations_supplierId` (`supplierId`),
  KEY `IDX_supplier_locations_locationId` (`locationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
