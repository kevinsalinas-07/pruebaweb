const express = require('express');
const router = express.Router();
const { verificarIntento, reiniciarJuego } = require('../controllers/juegoController');

router.post('/guess', verificarIntento);
router.post('/reset', reiniciarJuego);

module.exports = router;