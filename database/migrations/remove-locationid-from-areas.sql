-- Migration: Remove locationId column from areas table
-- Date: 2024-01-XX
-- Description: Remove the relationship between areas and locations.
--             Areas are now only related to companies (not locations/filials).
--             This simplifies the model: Locations = physical establishments/filials
--             Areas = internal areas within establishments (Salão, Varanda, etc.)

-- Step 1: Remove the index on locationId
ALTER TABLE `cliente_petiscaria_areas` DROP INDEX IF EXISTS `IDX_areas_locationId`;

-- Step 2: Remove the foreign key constraint (if it exists)
-- Note: Check your database if foreign keys are enforced
-- ALTER TABLE `cliente_petiscaria_areas` DROP FOREIGN KEY IF EXISTS `FK_areas_locationId`;

-- Step 3: Remove the locationId column
ALTER TABLE `cliente_petiscaria_areas` DROP COLUMN IF EXISTS `locationId`;

-- Verification query (run after migration to verify):
-- DESCRIBE `cliente_petiscaria_areas`;
-- Expected columns: id, name, description, companyId, createdAt, updatedAt

