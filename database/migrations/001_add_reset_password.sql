-- Migración: Agregar campos para recuperación de contraseña
-- Ejecutar si ya tienes la tabla users creada
ALTER TABLE users
ADD COLUMN reset_token VARCHAR(36) DEFAULT NULL
AFTER preferred_language;
ALTER TABLE users
ADD COLUMN reset_token_expires TIMESTAMP NULL
AFTER reset_token;
ALTER TABLE users
ADD INDEX idx_reset_token (reset_token);