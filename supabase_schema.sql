-- ====================================================================
-- SWIFTTABLE - ESQUEMA MULTI-RESTAURANTE PARA POSTGRESQL (SUPABASE / NEON)
-- ====================================================================

-- 1. LIMPIEZA DE TABLAS Y TIPOS ENUM (En caso de reinicio)
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS detalles_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS comensales CASCADE;
DROP TABLE IF EXISTS asistencias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS mesas CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS restaurantes CASCADE;

DROP TYPE IF EXISTS estadomesa CASCADE;
DROP TYPE IF EXISTS rolusuario CASCADE;
DROP TYPE IF EXISTS estadousuario CASCADE;
DROP TYPE IF EXISTS tipoasistencia CASCADE;
DROP TYPE IF EXISTS estadoasistencia CASCADE;
DROP TYPE IF EXISTS estadosesion CASCADE;
DROP TYPE IF EXISTS estadopedido CASCADE;
DROP TYPE IF EXISTS metodopago CASCADE;

-- 2. CREACIÓN DE TIPOS ENUM PERSONALIZADOS
CREATE TYPE estadomesa AS ENUM ('libre', 'ocupada', 'por_limpiar');
CREATE TYPE rolusuario AS ENUM ('admin', 'mesero');
CREATE TYPE estadousuario AS ENUM ('activo', 'inactivo');
CREATE TYPE tipoasistencia AS ENUM ('llamar_mesero', 'pedir_cuenta', 'traer_cubiertos', 'traer_servilletas', 'traer_hielo', 'retirar_platos');
CREATE TYPE estadoasistencia AS ENUM ('pendiente', 'atendido');
CREATE TYPE estadosesion AS ENUM ('activa', 'inactiva');
CREATE TYPE estadopedido AS ENUM ('pendiente', 'en_preparacion', 'listo_para_servir', 'servido', 'pagado', 'cancelado');
CREATE TYPE metodopago AS ENUM ('efectivo', 'tarjeta', 'yape', 'plin');

-- 3. CREACIÓN DE TABLAS

-- Tabla Maestra: Restaurantes (Tenants/Inquilinos)
CREATE TABLE restaurantes (
    id_restaurante SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ruc VARCHAR(11) UNIQUE NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'activo',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categorías de Productos (Aisladas por Restaurante)
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    UNIQUE (nombre, id_restaurante) -- Permite tener una categoría 'Bebidas' en diferentes restaurantes
);
CREATE INDEX ix_categorias_id_restaurante ON categorias(id_restaurante);

-- Mesas del Restaurante (Aisladas por Restaurante)
CREATE TABLE mesas (
    id_mesa SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    estado estadomesa DEFAULT 'libre',
    codigo_qr VARCHAR(255) UNIQUE,
    pin VARCHAR(4),
    token_sesion VARCHAR(36) UNIQUE,
    tipo_pago VARCHAR(20) DEFAULT 'no_decidido',
    tiempo_espera_adicional INTEGER DEFAULT 0,
    UNIQUE (numero, id_restaurante) -- Permite que cada restaurante tenga su propia 'Mesa 1001'
);
CREATE INDEX ix_mesas_id_restaurante ON mesas(id_restaurante);

-- Usuarios / Personal del Restaurante (Aislados por Restaurante)
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL, -- El correo de login sigue siendo único a nivel global de plataforma
    contrasena VARCHAR(255) NOT NULL,
    rol rolusuario NOT NULL,
    estado estadousuario DEFAULT 'activo'
);
CREATE INDEX ix_usuarios_id_restaurante ON usuarios(id_restaurante);

-- Asistencias y Alertas (Llamados de mesas aislados por Restaurante)
CREATE TABLE asistencias (
    id_asistencia SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    tipo tipoasistencia NOT NULL,
    estado estadoasistencia DEFAULT 'pendiente',
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_mesa INTEGER NOT NULL REFERENCES mesas(id_mesa) ON DELETE CASCADE
);
CREATE INDEX ix_asistencias_id_restaurante ON asistencias(id_restaurante);
CREATE INDEX ix_asistencias_id_mesa ON asistencias(id_mesa);

-- Clientes / Comensales (Aislados por Restaurante)
CREATE TABLE comensales (
    id_comensal SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    estado_sesion estadosesion DEFAULT 'activa',
    id_mesa INTEGER NOT NULL REFERENCES mesas(id_mesa) ON DELETE CASCADE,
    is_lider BOOLEAN DEFAULT FALSE,
    estado_pedido VARCHAR(20) DEFAULT 'eligiendo',
    carrito JSON DEFAULT '[]'::json
);
CREATE INDEX ix_comensales_id_restaurante ON comensales(id_restaurante);
CREATE INDEX ix_comensales_id_mesa ON comensales(id_mesa);

-- Productos del Menú (Aislados por Restaurante)
CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'disponible',
    id_categoria INTEGER NOT NULL REFERENCES categorias(id_categoria) ON DELETE RESTRICT,
    UNIQUE (nombre, id_categoria) -- Evita duplicar el mismo plato dentro de la misma categoría de un restaurante
);
CREATE INDEX ix_productos_id_restaurante ON productos(id_restaurante);

-- Comandas / Pedidos principales (Aislados por Restaurante)
CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado estadopedido DEFAULT 'pendiente',
    id_mesa INTEGER NOT NULL REFERENCES mesas(id_mesa) ON DELETE CASCADE,
    id_comensal INTEGER REFERENCES comensales(id_comensal) ON DELETE SET NULL,
    id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);
CREATE INDEX ix_pedidos_id_restaurante ON pedidos(id_restaurante);

-- Detalles individuales del Pedido
CREATE TABLE detalles_pedido (
    id_detalle SERIAL PRIMARY KEY,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT
);
CREATE INDEX ix_detalles_pedido_id_pedido ON detalles_pedido(id_pedido);

-- Registro de Pagos Realizados (Caja, Aislados por Restaurante)
CREATE TABLE pagos (
    id_pago SERIAL PRIMARY KEY,
    id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id_restaurante) ON DELETE CASCADE,
    monto_total DECIMAL(10, 2) NOT NULL,
    propina DECIMAL(10, 2) DEFAULT 0.00,
    metodo_pago metodopago NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_pedido INTEGER UNIQUE NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE
);
CREATE INDEX ix_pagos_id_restaurante ON pagos(id_restaurante);


-- ====================================================================
-- 4. POBLADO INICIAL MULTI-TENANT (SEMILLAS DE DATOS)
-- ====================================================================

-- 4.1. Sembrar dos restaurantes diferentes
INSERT INTO restaurantes (nombre, ruc, direccion, telefono) VALUES 
('La Fogata', '20456789123', 'Av. Universitaria 1801, Lima', '01-445566'),
('Pizzería Italia', '20987654321', 'Calle Larco 550, Miraflores', '01-778899');

-- 4.2. Sembrar Categorías
-- Restaurante 1 (La Fogata)
INSERT INTO categorias (id_restaurante, nombre, descripcion) VALUES 
(1, 'Pollos', 'Pollo a la brasa peruano y combos tradicionales'),
(1, 'Bebidas', 'Gaseosas y refrescos nacionales helados');

-- Restaurante 2 (Pizzería Italia)
INSERT INTO categorias (id_restaurante, nombre, descripcion) VALUES 
(2, 'Pizzas', 'Pizzas artesanales al horno de leña'),
(2, 'Bebidas', 'Vinos y bebidas italianas');

-- Categorías Adicionales
INSERT INTO categorias (id_restaurante, nombre, descripcion) VALUES
(1, 'Entradas y Guarniciones', 'Acompañamientos y entradas criollas'),
(1, 'Postres', 'Postres peruanos tradicionales'),
(2, 'Entradas', 'Entradas italianas tradicionales'),
(2, 'Postres', 'Postres italianos artesanales');



-- 4.3. Sembrar Mesas
-- Mesas para Restaurante 1 (La Fogata - Mesas 1001 al 1010)
INSERT INTO mesas (id_restaurante, numero, estado, pin) VALUES 
(1, 1001, 'libre', '1111'),
(1, 1002, 'libre', '2222'),
(1, 1003, 'libre', '3333'),
(1, 1004, 'libre', '4444'),
(1, 1005, 'libre', '5555'),
(1, 1006, 'libre', '6666'),
(1, 1007, 'libre', '7777'),
(1, 1008, 'libre', '8888'),
(1, 1009, 'libre', '9999'),
(1, 1010, 'libre', '1010');

-- Mesas para Restaurante 2 (Pizzería Italia - Mesas 1001 al 1010)
INSERT INTO mesas (id_restaurante, numero, estado, pin) VALUES 
(2, 1001, 'libre', '9991'),
(2, 1002, 'libre', '9992'),
(2, 1003, 'libre', '9993'),
(2, 1004, 'libre', '9994'),
(2, 1005, 'libre', '9995'),
(2, 1006, 'libre', '9996'),
(2, 1007, 'libre', '9997'),
(2, 1008, 'libre', '9998'),
(2, 1009, 'libre', '9999'),
(2, 1010, 'libre', '2020');


-- 4.4. Sembrar Productos
-- Productos para Restaurante 1 (La Fogata)
INSERT INTO productos (id_restaurante, nombre, descripcion, precio, id_categoria, estado) VALUES 
(1, 'Pollo a la brasa 1/4', 'Con papas fritas crocantes y ensalada clásica con aliño', 18.00, 1, 'disponible'),
(1, 'Pollo a la brasa 1/2', 'Con papas fritas crocantes y ensalada clásica con aliño', 32.00, 1, 'disponible'),
(1, 'Combo familiar', 'Un pollo entero + 4 vasos de bebida + porción grande de papas', 75.00, 1, 'disponible'),
(1, 'Inca Kola 500ml', 'Gaseosa de sabor tradicional peruano helada', 5.00, 2, 'disponible');

-- Productos para Restaurante 2 (Pizzería Italia)
INSERT INTO productos (id_restaurante, nombre, descripcion, precio, id_categoria, estado) VALUES 
(2, 'Pizza Margherita', 'Salsa de tomate pomodoro, queso mozzarella y albahaca fresca', 25.00, 3, 'disponible'),
(2, 'Pizza Pepperoni', 'Queso mozzarella y abundantes rodajas de pepperoni americano', 29.00, 3, 'disponible'),
(2, 'Copa de Vino Tinto', 'Vino de la casa Chianti', 14.00, 4, 'disponible'),
(2, 'Coca-Cola 500ml', 'Gaseosa sabor original helada', 5.00, 4, 'disponible');

-- Productos Adicionales para La Fogata (id_restaurante = 1)
INSERT INTO productos (id_restaurante, nombre, descripcion, precio, id_categoria, estado) VALUES
(1, 'Pollo a la brasa 1 entero', 'Pollo entero marinado con papas fritas y ensalada familiar', 62.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 1 AND nombre = 'Pollos'), 'disponible'),
(1, 'Pechuga a la parrilla', 'Filete de pechuga tierna a la parrilla con papas fritas', 24.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 1 AND nombre = 'Pollos'), 'disponible'),
(1, 'Chicha Morada 1L', 'Bebida de maíz morado, piña, manzana y canela helada', 12.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 1 AND nombre = 'Bebidas'), 'disponible'),
(1, 'Inca Kola 1.5L', 'Gaseosa tamaño familiar helada', 9.50, (SELECT id_categoria FROM categorias WHERE id_restaurante = 1 AND nombre = 'Bebidas'), 'disponible'),
(1, 'Anticuchos', 'Dos palitos de corazón de res con papa dorada y choclo', 22.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 1 AND nombre = 'Entradas y Guarniciones'), 'disponible'),
(1, 'Porción de Tequeños', 'Tequeños rellenos de queso con salsa guacamole', 14.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 1 AND nombre = 'Entradas y Guarniciones'), 'disponible'),
(1, 'Porción de Papas Fritas Extra', 'Papas amarillas crocantes recién fritas', 8.50, (SELECT id_categoria FROM categorias WHERE id_restaurante = 1 AND nombre = 'Entradas y Guarniciones'), 'disponible'),
(1, 'Suspiro a la Limeña', 'Dulce tradicional de yemas y leche evaporada con merengue', 10.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 1 AND nombre = 'Postres'), 'disponible'),
(1, 'Tres Leches de Lúcuma', 'Pastel húmedo sabor lúcuma bañado en tres leches', 12.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 1 AND nombre = 'Postres'), 'disponible');

-- Productos Adicionales para Pizzería Italia (id_restaurante = 2)
INSERT INTO productos (id_restaurante, nombre, descripcion, precio, id_categoria, estado) VALUES
(2, 'Pizza Cuatro Quesos', 'Mozzarella, gorgonzola, parmesano y fontina', 34.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 2 AND nombre = 'Pizzas'), 'disponible'),
(2, 'Pizza Hawaiana', 'Mozzarella, jamón inglés y piña en almíbar', 28.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 2 AND nombre = 'Pizzas'), 'disponible'),
(2, 'Pizza Vegetariana', 'Pimientos, champiñones, aceitunas verdes y cebolla blanca', 30.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 2 AND nombre = 'Pizzas'), 'disponible'),
(2, 'Limonada Italiana', 'Limonada frozen con toque de menta y jengibre', 8.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 2 AND nombre = 'Bebidas'), 'disponible'),
(2, 'Botella de Vino Chianti', 'Vino tinto italiano tradicional de la casa', 48.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 2 AND nombre = 'Bebidas'), 'disponible'),
(2, 'Focaccia con Romero', 'Pan plano italiano sazonado con aceite de oliva y romero', 12.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 2 AND nombre = 'Entradas'), 'disponible'),
(2, 'Bruschetta de Pomodoro', 'Pan tostado con tomate picado, albahaca y aceite de oliva', 10.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 2 AND nombre = 'Entradas'), 'disponible'),
(2, 'Tiramisú Tradicional', 'Bizcochos de café, licor de amaretto y crema de mascarpone', 16.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 2 AND nombre = 'Postres'), 'disponible'),
(2, 'Panna Cotta de Fresa', 'Flan de crema de leche con coulis de fresas frescas', 12.00, (SELECT id_categoria FROM categorias WHERE id_restaurante = 2 AND nombre = 'Postres'), 'disponible');




-- 4.5. Sembrar un Personal Administrativo por cada Restaurante
INSERT INTO usuarios (id_restaurante, nombre, correo, contrasena, rol, estado) VALUES
(1, 'Administrador Fogata', 'admin@lafogata.com', '$2b$12$IBNOsV3zT3/0oYdQkWIo..gYW6wIzWLfUaDvQ0wn2oM8OO9EgpLFC', 'admin', 'activo'),
(2, 'Administrador Italia', 'admin@pizzaitalia.com', '$2b$12$lJLn/Q6qtkJBTVyDQ.ceCeeVZVgRjc5QC77XV7QKnN.ck9/PtVVqK', 'admin', 'activo');
