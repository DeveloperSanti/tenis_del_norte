-- ============================================================
-- setup.sql — Tenis del Norte
-- Ejecuta esto UNA VEZ en phpMyAdmin de Hostinger
-- ============================================================

CREATE DATABASE IF NOT EXISTS `tenis_norte`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `tenis_norte`;

CREATE TABLE IF NOT EXISTS `tenis` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `referencia`  VARCHAR(50)   NOT NULL COMMENT 'Número/código de referencia',
  `marca`       VARCHAR(100)  NOT NULL,
  `categoria`   ENUM('hombre','mujer','unisex') NOT NULL DEFAULT 'unisex',
  `promocion`   TINYINT(1)    NOT NULL DEFAULT 0,
  `imagen_url`  VARCHAR(500)  NOT NULL,
  `creado_en`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_marca`     (`marca`),
  INDEX `idx_categoria` (`categoria`),
  INDEX `idx_promocion` (`promocion`),
  INDEX `idx_ref`       (`referencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para usuarios administradores
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `usuario`    VARCHAR(50)   NOT NULL UNIQUE,
  `password`   VARCHAR(255)  NOT NULL COMMENT 'Contraseña hasheada con password_hash',
  `creado_en`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Datos de ejemplo (elimínalos cuando quieras) ─────────────
INSERT INTO `tenis` (`referencia`, `marca`, `categoria`, `promocion`, `imagen_url`) VALUES
  ('REF-0001', 'Nike',        'hombre',  0, 'uploads/ejemplo1.jpg'),
  ('REF-0002', 'Adidas',      'mujer',   1, 'uploads/ejemplo2.jpg'),
  ('REF-0003', 'Puma',        'unisex',  0, 'uploads/ejemplo3.jpg'),
  ('REF-0004', 'New Balance', 'hombre',  1, 'uploads/ejemplo4.jpg'),
  ('REF-0005', 'Nike',        'mujer',   0, 'uploads/ejemplo5.jpg'),
  ('REF-0006', 'Jordan',      'unisex',  1, 'uploads/ejemplo6.jpg');

-- Usuario admin de ejemplo (contraseña: admin123)
INSERT INTO `usuarios` (`usuario`, `password`) VALUES
  ('admin', '$2y$10$Z9DOpVkNs4SDG3aphH0P9OI7O0iFN3aVWMmk36NbPe8/22L5bbtlK'); -- bcrypt hash for 'admin123'