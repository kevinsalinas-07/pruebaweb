// scripts/seed.js
const pool = require('../database/db');

// Arreglo de objetos (uso explícito de const, object, number y string)
const menuInicial = [
  { id: 101, nombre: 'Menú Ejecutivo (Pollo)', precio: 5.50, stock: 12, categoria: 'Fuerte' },
  { id: 102, nombre: 'Pasta Alfredo', precio: 4.50, stock: 8, categoria: 'Pasta' },
  { id: 103, nombre: 'Ensalada César', precio: 3.50, stock: 5, categoria: 'Entrada' },
  { id: 104, nombre: 'Bebida Natural', precio: 1.50, stock: 15, categoria: 'Bebida' }
];

async function inicializarBaseDeDatos() {
  const client = await pool.connect();
  try {
    console.log('⏳ Inicializando tablas en PostgreSQL (Neon.tech)...');
    await client.query('BEGIN');

    // 1. Eliminar tablas previas si existen para garantizar un entorno limpio
    await client.query(`
      DROP TABLE IF EXISTS reserva_items CASCADE;
      DROP TABLE IF EXISTS menu CASCADE;
      DROP TABLE IF EXISTS reserva_usuario CASCADE;
    `);

    // 2. Crear las tablas
    await client.query(`
      CREATE TABLE menu (
        id INT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        precio NUMERIC(10, 2) NOT NULL,
        stock INT NOT NULL CHECK (stock >= 0),
        categoria VARCHAR(50) NOT NULL
      );

      CREATE TABLE reserva_usuario (
        id INT PRIMARY KEY,
        saldo NUMERIC(10, 2) NOT NULL CHECK (saldo >= 0),
        total NUMERIC(10, 2) NOT NULL DEFAULT 0.00
      );

      CREATE TABLE reserva_items (
        id INT PRIMARY KEY REFERENCES menu(id) ON DELETE CASCADE,
        cantidad INT NOT NULL CHECK (cantidad > 0)
      );
    `);

    // 3. Insertar el registro del usuario con saldo inicial de $25.00 y total $0.00
    await client.query(
      'INSERT INTO reserva_usuario (id, saldo, total) VALUES ($1, $2, $3)',
      [1, 25.00, 0.00]
    );

    // 4. Poblar el catálogo del menú iterando sobre el arreglo
    for (const plato of menuInicial) {
      await client.query(
        'INSERT INTO menu (id, nombre, precio, stock, categoria) VALUES ($1, $2, $3, $4, $5)',
        [plato.id, plato.nombre, plato.precio, plato.stock, plato.categoria]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Base de datos inicializada y poblada con éxito.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al ejecutar el seed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

inicializarBaseDeDatos();