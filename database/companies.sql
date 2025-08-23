-- Criação da tabela de empresas (companies)
CREATE TABLE IF NOT EXISTS `cliente_petiscaria_companies` (
  `id` varchar(36) NOT NULL,
  `fantasia` varchar(255) NOT NULL,
  `razao_social` varchar(255) NOT NULL,
  `documento` varchar(255) NOT NULL,
  `pix_config` json DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL,
  `active` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_documento` (`documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
