// src/controllers/juegoController.js

// Función modular generadora de número aleatorio entre 1 y 100
const generarNumeroAleatorio = () => {
    return Math.floor(Math.random() * 100) + 1;
  };
  
  // Variable de estado en el servidor (uso de let porque cambia al reiniciar)
  let numeroSecreto = generarNumeroAleatorio();
  let historialServidor = [];
  
  // POST /guess -> Evalúa el intento del cliente
  const verificarIntento = (req, res) => {
    const { numero } = req.body;
    const intentoUsuario = Number(numero);
  
    // Validación de tipo de dato number y rango válido (1 a 100)
    const esInvalido = Number.isNaN(intentoUsuario) || intentoUsuario < 1 || intentoUsuario > 100;
    if (esInvalido) {
      return res.status(400).json({
        error: 'Debes ingresar un número válido entre 1 y 100.'
      });
    }
  
    let resultado = '';
    let acertado = false;
  
    // Lógica principal: indica si el número oculto es "mayor", "menor" o "correcto"
    if (numeroSecreto > intentoUsuario) {
      resultado = 'mayor';
    } else if (numeroSecreto < intentoUsuario) {
      resultado = 'menor';
    } else {
      resultado = 'correcto';
      acertado = true;
    }
  
    // Guardamos el registro en un arreglo del servidor para trazabilidad
    historialServidor.push({
      numero: intentoUsuario,
      resultado,
      acertado
    });
  
    return res.status(200).json({
      resultado, // "mayor" | "menor" | "correcto"
      mensaje:
        resultado === 'correcto'
          ? `¡Correcto! Adivinaste el número oculto (${numeroSecreto}).`
          : `El número oculto es ${resultado} que ${intentoUsuario}.`,
      acertado,
      totalIntentos: historialServidor.length
    });
  };
  
  // POST /reset -> Genera un nuevo número aleatorio entre 1 y 100
  const reiniciarJuego = (req, res) => {
    numeroSecreto = generarNumeroAleatorio();
    historialServidor = [];
  
    return res.status(200).json({
      mensaje: 'Partida reiniciada. Se ha generado un nuevo número secreto entre 1 y 100.',
      reiniciado: true
    });
  };
  
  module.exports = {
    verificarIntento,
    reiniciarJuego
  };