-- Tabela de Logs de Auditoria
DROP TABLE IF EXISTS `cliente_gp_audit_logs`;
CREATE TABLE IF NOT EXISTS `cliente_gp_audit_logs` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `userName` varchar(255) NOT NULL,
  `action` enum('create','update','delete','login','logout','access') NOT NULL,
  `entityName` varchar(100) NOT NULL,
  `entityId` varchar(36) NOT NULL,
  `oldValues` json DEFAULT NULL,
  `newValues` json DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `companyId` varchar(36) NOT NULL,
  `locationId` varchar(36) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_audit_log_company_action` (`companyId`,`action`,`entityName`),
  KEY `IDX_audit_log_location_action` (`locationId`,`action`,`entityName`),
  KEY `IDX_audit_log_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
