// src/routes/reservaRoutes.js
const express = require('express');
const router = express.Router();
const {
  obtenerMenu,
  obtenerReserva,
  agregarPlatoReserva,
  actualizarPorciones,
  eliminarPlatoReserva,
  confirmarReserva,
  expirarReserva
} = require('../controllers/reservaController');

// Los 5 Endpoints Obligatorios del Caso Food DEI S.A. de R.L.
router.get('/menu', obtenerMenu);
router.get('/reserva', obtenerReserva);
router.post('/reserva/agregar', agregarPlatoReserva);
router.put('/reserva/actualizar-porciones/:id', actualizarPorciones);
router.delete('/reserva/eliminar/:id', eliminarPlatoReserva);

// Endpoints Auxiliares para Confirmación y Límite de Tiempo
router.post('/reserva/confirmar', confirmarReserva);
router.post('/reserva/expirar', expirarReserva);

module.exports = router;