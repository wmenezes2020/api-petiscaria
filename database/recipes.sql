-- Tabela de Receitas
CREATE TABLE IF NOT EXISTS `cliente_petiscaria_recipes` (
  `id` CHAR(36) NOT NULL,
  `companyId` CHAR(36) NOT NULL,
  `productId` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `servings` INT NOT NULL DEFAULT 1,
  `preparationTime` INT NOT NULL DEFAULT 30,
  `cookingTime` INT NOT NULL DEFAULT 0,
  `instructions` VARCHAR(500) NULL,
  `ingredients` JSON NULL,
  `totalCost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `costPerServing` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(500) NULL,
  `metadata` JSON NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_company_product` (`companyId`, `productId`),
  INDEX `idx_company_name` (`companyId`, `name`),
  CONSTRAINT `fk_recipes_company` FOREIGN KEY (`companyId`) REFERENCES `cliente_petiscaria_companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recipes_product` FOREIGN KEY (`productId`) REFERENCES `cliente_petiscaria_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




