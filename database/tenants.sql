DROP TABLE IF EXISTS `cliente_gp_role_permissions`;
DROP TABLE IF EXISTS `cliente_gp_user_tokens`;
DROP TABLE IF EXISTS `cliente_gp_tenant_users`;
DROP TABLE IF EXISTS `cliente_gp_roles`;
DROP TABLE IF EXISTS `cliente_gp_permissions`;
DROP TABLE IF EXISTS `cliente_gp_tenants`;

CREATE TABLE `cliente_gp_tenants` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `legalName` varchar(255) DEFAULT NULL,
  `document` varchar(20) DEFAULT NULL,
  `primaryEmail` varchar(255) DEFAULT NULL,
  `primaryPhone` varchar(20) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `plan` varchar(50) NOT NULL DEFAULT 'basic',
  `planExpiresAt` datetime DEFAULT NULL,
  `billingInfo` json DEFAULT NULL,
  `configPix` json DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `timezone` varchar(64) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cliente_gp_permissions` (
  `id` char(36) NOT NULL,
  `key` varchar(255) NOT NULL,
  `resource` varchar(120) NOT NULL,
  `action` varchar(120) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_permission_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cliente_gp_roles` (
  `id` char(36) NOT NULL,
  `tenantId` char(36) DEFAULT NULL,
  `key` varchar(120) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `isSystem` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_role_key_tenant` (`key`,`tenantId`),
  KEY `idx_role_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cliente_gp_tenant_users` (
  `id` char(36) NOT NULL,
  `tenantId` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `roles` text DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_tenant_user` (`tenantId`,`userId`),
  KEY `idx_tenant_users_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cliente_gp_role_permissions` (
  `roleId` char(36) NOT NULL,
  `permissionId` char(36) NOT NULL,
  PRIMARY KEY (`roleId`,`permissionId`),
  KEY `idx_role_permission_perm` (`permissionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cliente_gp_user_tokens` (
  `id` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `tenantId` char(36) DEFAULT NULL,
  `tokenHash` varchar(500) NOT NULL,
  `userAgent` varchar(255) DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `expiresAt` datetime NOT NULL,
  `revokedAt` datetime DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_user_tokens_user` (`userId`),
  KEY `idx_user_tokens_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

