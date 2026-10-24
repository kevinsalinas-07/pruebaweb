// client/src/api/juegoApi.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Envía el número al endpoint POST /guess usando async/await
export const enviarIntentoApi = async (numero) => {
  const respuesta = await fetch(`${API_BASE_URL}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero: Number(numero) })
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error al procesar el intento');
  }

  return datos;
};

// Reinicia la partida llamando a POST /reset con manejo de promesas (.then / .catch)
export const reiniciarJuegoApi = () => {
  return fetch(`${API_BASE_URL}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
    .then((respuesta) => {
      if (!respuesta.ok) {
        throw new Error('No se pudo reiniciar el juego en el servidor');
      }
      return respuesta.json();
    })
    .catch((error) => {
      throw error;
    });
};