// database/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Validación preventiva para asegurar que exista DATABASE_URL al clonar el proyecto
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR CRÍTICO: No se encontró DATABASE_URL en el archivo .env');
  process.exit(1);
}

// Creación del Pool de conexiones a PostgreSQL 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para conexiones seguras.
  }
});

module.exports = pool;