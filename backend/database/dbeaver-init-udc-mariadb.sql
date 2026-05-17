-- =============================================================================
-- UDC — iniciar base de datos MariaDB / MySQL (para ejecutar desde DBeaver)
-- =============================================================================
-- Cómo usar en DBeaver:
--   1) Conéctate con un usuario con permisos (normalmente root o ADMIN de la BD).
--   2) Archivo → Abrir SQL → elegir este script.
--   3) Ejecutar todo el script (Ctrl+Alt+X o botón Ejecutar).
--
-- IMPORTANTE:
--   - Este script crea SOLO la base de datos lógica y el usuario SQL.
--   - Las TABLAS las crea/actualiza Spring Boot con Hibernate al arrancar
--     (spring.jpa.hibernate.ddl-auto=update en application-mariadb.properties).
--
-- Contraseña: debe coincidir con spring.datasource.password en
-- application-mariadb.properties (por defecto: cambiar).
-- =============================================================================

-- Base de datos de la aplicación
CREATE DATABASE IF NOT EXISTS udc
	CHARACTER SET utf8mb4
	COLLATE utf8mb4_unicode_ci;

-- Usuario dedicado para la aplicación (solo localhost; amplía a '%' si el servidor JBDC no va en esta máquina)
CREATE USER IF NOT EXISTS 'udc'@'localhost' IDENTIFIED BY 'cambiar';

GRANT ALL PRIVILEGES ON udc.* TO 'udc'@'localhost';
FLUSH PRIVILEGES;

-- (Opcional) Si MySQL/MariaDB exige uso explícito de la BD después:
-- USE udc;
