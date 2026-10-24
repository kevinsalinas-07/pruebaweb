-- database/schema.sql
DROP TABLE IF EXISTS reserva_items
CASCADE;
DROP TABLE IF EXISTS menu
CASCADE;
DROP TABLE IF EXISTS reserva_usuario
CASCADE;

-- Tabla del catálogo de platos disponibles hoy
CREATE TABLE menu
(
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    stock INT NOT NULL CHECK (stock >= 0),
    categoria VARCHAR(50) NOT NULL
);

-- Tabla que almacena el saldo mensual/diario del cliente y el total acumulado de su reserva
CREATE TABLE reserva_usuario
(
    id INT PRIMARY KEY,
    saldo NUMERIC(10, 2) NOT NULL CHECK (saldo >= 0),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- Tabla detalle de los platillos en la bandeja activa del usuario
CREATE TABLE reserva_items
(
    id INT PRIMARY KEY REFERENCES menu(id) ON DELETE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0)
);