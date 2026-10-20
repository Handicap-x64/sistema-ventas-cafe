-- =====================================================
-- DATOS DE PRUEBA PARA BASE DE DATOS CAFE
-- Generado a partir de schema.sql
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar datos previos (útil para re-ejecutar)
TRUNCATE TABLE detalles_compras;
TRUNCATE TABLE detalles_ventas;
TRUNCATE TABLE compras;
TRUNCATE TABLE ventas;
TRUNCATE TABLE proveedores;
TRUNCATE TABLE clientes;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- CLIENTES
-- =====================================================
INSERT INTO clientes (nombre, rif, nombre_con, cedula_con, telefono_con, email_con, activo) VALUES
('Cafetería El Aroma C.A.',      'J-12345678-9', 'José Antonio Pérez',   '12345678', '04141234567', 'jose.perez@elaroma.com',      TRUE),
('Panadería & Café Dulzura',     'J-23456789-0', 'María Gabriela Rojas', '23456789', '04142345678', 'maria.rojas@dulzura.com',     TRUE),
('Supermercado La Plaza C.A.',   'J-34567890-1', 'Carlos Eduardo Méndez','34567890', '04244567890', 'carlos.mendez@laplaza.com',   TRUE),
('Hotel Bella Vista',            'J-45678901-2', 'Luisa Fernanda Torres','45678901', '04125678901', 'luisa.torres@bellavista.com', TRUE),
('Restaurante Sabores del Sur',  'J-56789012-3', 'Pedro José Hernández', '56789012', '04266789012', 'pedro.hernandez@sabores.com', TRUE),
('Tienda Gourmet Caracas',       'J-67890123-4', 'Ana Beatriz Silva',    '67890123', '04147890123', 'ana.silva@gourmetccs.com',    TRUE),
('Café Express Los Teques',      'J-78901234-5', 'Ricardo Andrés López', '78901234', '04158901234', 'ricardo.lopez@cafeexpress.com', TRUE),
('Distribuidora Alimentos Vega', 'J-89012345-6', 'Yolimar del Valle Gil','89012345', '04269012345', 'yolimar.gil@distvega.com',    FALSE);

-- =====================================================
-- PROVEEDORES
-- =====================================================
INSERT INTO proveedores (nombre, rif, nombre_con, cedula_con, telefono_con, email_con, activo) VALUES
('Finca Los Andes',              'J-11223344-5', 'Manuel de Jesús Ortiz','11223344', '04161122334', 'manuel.ortiz@losandes.com',   TRUE),
('AgroCafé Venezuela C.A.',      'J-22334455-6', 'Diana Carolina Mora',  '22334455', '04172233445', 'diana.mora@agrocafe.com',     TRUE),
('Cooperativa Caficultores Lara','J-33445566-7', 'José Ramón Quintero',  '33445566', '04283344556', 'jose.quintero@cclara.com',    TRUE),
('Beneficiadora El Ávila',       'J-44556677-8', 'Maribel Alejandra Ruiz','44556677', '04194455667', 'maribel.ruiz@elavila.com',    TRUE),
('Exportadora Táchira Café',     'J-55667788-9', 'Nelson Enrique Vargas','55667788', '04205566778', 'nelson.vargas@tachiracafe.com', TRUE);

-- =====================================================
-- COMPRAS
-- =====================================================
INSERT INTO compras (id_prov, fecha, pagado) VALUES
(1, '2025-09-10', TRUE),
(2, '2025-09-18', TRUE),
(3, '2025-09-25', TRUE),
(4, '2025-10-03', TRUE),
(5, '2025-10-09', TRUE),
(1, '2025-10-16', FALSE),
(2, '2025-10-21', TRUE);

-- =====================================================
-- DETALLES DE COMPRAS
-- =====================================================
INSERT INTO detalles_compras (id_compra, producto, cantidad_kg, precio) VALUES
-- Compra 1 - Finca Los Andes
(1, 'SUAVE',  40.00,  92.50),
(1, 'NORMAL', 80.00, 108.00),
(1, 'FUERTE', 30.00, 124.75),

-- Compra 2 - AgroCafé Venezuela
(2, 'SUAVE',  60.00,  94.00),
(2, 'NORMAL', 90.00, 109.25),
(2, 'FUERTE', 40.00, 126.00),

-- Compra 3 - Cooperativa Caficultores Lara
(3, 'SUAVE',  50.00,  91.80),
(3, 'NORMAL', 70.00, 107.40),
(3, 'FUERTE', 25.00, 123.90),

-- Compra 4 - Beneficiadora El Ávila
(4, 'NORMAL', 100.00, 110.00),
(4, 'FUERTE',  60.00, 125.50),
(4, 'SUAVE',   35.00,  93.25),

-- Compra 5 - Exportadora Táchira Café
(5, 'SUAVE',   75.00,  95.40),
(5, 'NORMAL',  85.00, 111.00),
(5, 'FUERTE',  50.00, 127.25),

-- Compra 6 - Finca Los Andes (pendiente de pago)
(6, 'NORMAL',  60.00, 109.80),
(6, 'FUERTE',  40.00, 125.90),

-- Compra 7 - AgroCafé Venezuela
(7, 'SUAVE',   55.00,  94.60),
(7, 'NORMAL',  95.00, 110.40),
(7, 'FUERTE',  45.00, 126.80);

-- =====================================================
-- VENTAS
-- =====================================================
INSERT INTO ventas (id_cli, fecha, tasa_bcv, pagado) VALUES
(1, '2025-09-15', 36.25, TRUE),
(2, '2025-09-19', 36.40, TRUE),
(3, '2025-09-26', 36.58, TRUE),
(4, '2025-10-04', 36.72, TRUE),
(5, '2025-10-10', 36.85, TRUE),
(6, '2025-10-14', 37.02, TRUE),
(1, '2025-10-17', 37.15, TRUE),
(7, '2025-10-18', 37.24, TRUE),
(3, '2025-10-22', 37.38, FALSE),
(5, '2025-10-23', 37.46, TRUE);

-- =====================================================
-- DETALLES DE VENTAS
-- =====================================================
INSERT INTO detalles_ventas (id_venta, producto, cantidad_kg, precio_bs) VALUES
-- Venta 1 - Cafetería El Aroma
(1, 'NORMAL',  8.00,  685.00),
(1, 'SUAVE',   4.00,  595.00),
(1, 'FUERTE',  2.00,  785.00),

-- Venta 2 - Panadería & Café Dulzura
(2, 'NORMAL',  6.00,  690.00),
(2, 'SUAVE',   5.00,  600.00),

-- Venta 3 - Supermercado La Plaza
(3, 'NORMAL', 25.00,  695.00),
(3, 'FUERTE', 12.00,  798.00),
(3, 'SUAVE',  10.00,  608.00),

-- Venta 4 - Hotel Bella Vista
(4, 'NORMAL', 15.00,  700.00),
(4, 'FUERTE',  8.00,  805.00),

-- Venta 5 - Restaurante Sabores del Sur
(5, 'NORMAL', 10.00,  705.00),
(5, 'SUAVE',   6.00,  615.00),
(5, 'FUERTE',  4.00,  812.00),

-- Venta 6 - Tienda Gourmet Caracas
(6, 'FUERTE',  7.00,  820.00),
(6, 'NORMAL',  9.00,  712.00),
(6, 'SUAVE',   3.00,  625.00),

-- Venta 7 - Cafetería El Aroma
(7, 'NORMAL', 12.00,  718.00),
(7, 'FUERTE',  5.00,  828.00),

-- Venta 8 - Café Express Los Teques
(8, 'SUAVE',   8.00,  632.00),
(8, 'NORMAL',  7.00,  725.00),

-- Venta 9 - Supermercado La Plaza (pendiente de pago)
(9, 'NORMAL', 18.00,  732.00),
(9, 'FUERTE',  9.00,  840.00),

-- Venta 10 - Restaurante Sabores del Sur
(10, 'NORMAL', 14.00, 740.00),
(10, 'SUAVE',   9.00, 640.00),
(10, 'FUERTE',  6.00, 848.00);
