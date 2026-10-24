// src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const juegoRoutes = require('./routes/juegoRoutes');
const reservaRoutes = require('./routes/reservaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas del Ejercicio 1: "Adivina el Número" (disponibles en raíz /guess y /reset, y también bajo /api)
app.use('/', juegoRoutes);
app.use('/api', juegoRoutes);

// Rutas del Ejercicio 2: Caso "Food DEI S.A. de R.L." (/api/menu, /api/reserva, etc.)
app.use('/api', reservaRoutes);

// Ruta de verificación de salud del servidor
app.get('/', (req, res) => {
  res.json({
    estado: 'OK',
    proyecto: 'Evaluación II - Programación Web (Ciclo 02, 2026)',
    endpoints: ['/guess', '/reset', '/api/menu', '/api/reserva']
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend Express ejecutándose en http://localhost:${PORT}`);
});