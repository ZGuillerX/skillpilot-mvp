-- Migración: Agregar campos para recuperación de contraseña
-- Ejecutar si ya tienes la tabla users creada
SET @has_reset_token := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
            AND table_name = 'users'
            AND column_name = 'reset_token'
    );
SET @sql := IF(
        @has_reset_token = 0,
        'ALTER TABLE users ADD COLUMN reset_token VARCHAR(36) DEFAULT NULL AFTER preferred_language',
        'SELECT "reset_token_exists"'
    );
PREPARE stmt
FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @has_reset_token_expires := (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
            AND table_name = 'users'
            AND column_name = 'reset_token_expires'
    );
SET @sql := IF(
        @has_reset_token_expires = 0,
        'ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP NULL AFTER reset_token',
        'SELECT "reset_token_expires_exists"'
    );
PREPARE stmt
FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @has_idx_reset_token := (
        SELECT COUNT(*)
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
            AND table_name = 'users'
            AND index_name = 'idx_reset_token'
    );
SET @sql := IF(
        @has_idx_reset_token = 0,
        'ALTER TABLE users ADD INDEX idx_reset_token (reset_token)',
        'SELECT "idx_reset_token_exists"'
    );
PREPARE stmt
FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;