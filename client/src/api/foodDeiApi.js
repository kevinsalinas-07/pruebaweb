// client/src/api/foodDeiApi.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Función auxiliar para procesar respuestas HTTP y propagar errores de negocio (400 Bad Request)
const procesarRespuesta = async (respuesta) => {
  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(datos.error || 'Ocurrió un error en la petición al servidor');
  }
  return datos;
};

// Endpoint 1: GET /api/menu
export const obtenerMenuApi = async () => {
  const respuesta = await fetch(`${API_BASE_URL}/menu`);
  return procesarRespuesta(respuesta);
};

// Endpoint 2: GET /api/reserva
export const obtenerReservaApi = async () => {
  const respuesta = await fetch(`${API_BASE_URL}/reserva`);
  return procesarRespuesta(respuesta);
};

// Endpoint 3: POST /api/reserva/agregar
export const agregarPlatoApi = async (alimentoId, cantidad = 1) => {
  const respuesta = await fetch(`${API_BASE_URL}/reserva/agregar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alimentoId: Number(alimentoId), cantidad: Number(cantidad) })
  });
  return procesarRespuesta(respuesta);
};

// Endpoint 4: PUT /api/reserva/actualizar-porciones/:id
export const actualizarPorcionesApi = async (alimentoId, nuevaCantidad) => {
  const respuesta = await fetch(`${API_BASE_URL}/reserva/actualizar-porciones/${alimentoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad: Number(nuevaCantidad) })
  });
  return procesarRespuesta(respuesta);
};

// Endpoint 5: DELETE /api/reserva/eliminar/:id
export const eliminarPlatoApi = async (alimentoId) => {
  const respuesta = await fetch(`${API_BASE_URL}/reserva/eliminar/${alimentoId}`, {
    method: 'DELETE'
  });
  return procesarRespuesta(respuesta);
};

// Endpoint Auxiliar: POST /api/reserva/confirmar
export const confirmarReservaApi = async () => {
  const respuesta = await fetch(`${API_BASE_URL}/reserva/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return procesarRespuesta(respuesta);
};

// Endpoint Auxiliar: POST /api/reserva/expirar
export const expirarReservaApi = async () => {
  const respuesta = await fetch(`${API_BASE_URL}/reserva/expirar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return procesarRespuesta(respuesta);
};