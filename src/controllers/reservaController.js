// src/controllers/reservaController.js
const pool = require('../../database/db');

// Función auxiliar que formatea las filas de PostgreSQL convirtiendo NUMERIC (string) a Number
const formatearPlatoMenu = (fila) => ({
  id: Number(fila.id),
  nombre: String(fila.nombre),
  precio: Number(fila.precio),
  stock: Number(fila.stock),
  categoria: String(fila.categoria)
});

// Función auxiliar para obtener el estado completo y actualizado de la reserva
const obtenerEstadoReservaDB = async (client) => {
  const usuarioRes = await client.query('SELECT saldo, total FROM reserva_usuario WHERE id = 1');
  const itemsRes = await client.query('SELECT id, cantidad FROM reserva_items ORDER BY id ASC');

  const usuario = usuarioRes.rows[0];
  // Uso explícito de .map() para estructurar el arreglo itemsReservados
  const itemsReservados = itemsRes.rows.map((item) => ({
    id: Number(item.id),
    cantidad: Number(item.cantidad)
  }));

  return {
    saldo: Number(usuario.saldo),
    itemsReservados,
    total: Number(usuario.total)
  };
};

// 1. GET /api/menu -> Devuelve la lista completa de alimentos con precio y stock como Number
const obtenerMenu = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT id, nombre, precio, stock, categoria FROM menu ORDER BY id ASC');
    // Uso de .map() sobre el arreglo devuelto por PostgreSQL
    const listaMenu = resultado.rows.map(formatearPlatoMenu);
    return res.status(200).json(listaMenu);
  } catch (error) {
    console.error('Error en GET /api/menu:', error.message);
    return res.status(500).json({ error: 'Error interno al consultar el menú del día' });
  }
};

// 2. GET /api/reserva -> Devuelve { saldo, itemsReservados: [{ id, cantidad }], total }
const obtenerReserva = async (req, res) => {
  const client = await pool.connect();
  try {
    const estadoReserva = await obtenerEstadoReservaDB(client);
    return res.status(200).json(estadoReserva);
  } catch (error) {
    console.error('Error en GET /api/reserva:', error.message);
    return res.status(500).json({ error: 'Error interno al obtener la reserva activa' });
  } finally {
    client.release();
  }
};

// 3. POST /api/reserva/agregar -> Recibe { alimentoId, cantidad } y añade temporalmente a la reserva
const agregarPlatoReserva = async (req, res) => {
  // Soportamos tanto alimentoId como alimentold (por tipografía del documento PDF)
  const idRecibido = req.body.alimentoId ?? req.body.alimentold;
  const alimentoId = Number(idRecibido);
  const cantidad = Number(req.body.cantidad);

  if (Number.isNaN(alimentoId) || Number.isNaN(cantidad) || cantidad <= 0) {
    return res.status(400).json({ error: 'Datos de alimento o cantidad inválidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Consultamos el catálogo y usamos .find() para localizar el plato solicitado
    const menuRes = await client.query('SELECT id, nombre, precio, stock, categoria FROM menu FOR UPDATE');
    const catalogo = menuRes.rows.map(formatearPlatoMenu);
    const platoEncontrado = catalogo.find((item) => item.id === alimentoId);

    if (!platoEncontrado) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'El platillo solicitado no existe en el menú' });
    }

    // Validación obligatoria 1: Verificar stock suficiente
    if (platoEncontrado.stock < cantidad) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Consultamos saldo del usuario
    const usuarioRes = await client.query('SELECT saldo, total FROM reserva_usuario WHERE id = 1 FOR UPDATE');
    let saldoActual = Number(usuarioRes.rows[0].saldo);
    let totalActual = Number(usuarioRes.rows[0].total);
    const costoOperacion = Number((platoEncontrado.precio * cantidad).toFixed(2));

    // Validación obligatoria 2: Verificar saldo suficiente
    if (costoOperacion > saldoActual) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Saldo insuficiente para esta cantidad' });
    }

    // Actualizar stock del plato en la tabla menu
    const nuevoStock = platoEncontrado.stock - cantidad;
    await client.query('UPDATE menu SET stock = $1 WHERE id = $2', [nuevoStock, alimentoId]);

    // Insertar o incrementar la cantidad en reserva_items
    const itemExistenteRes = await client.query('SELECT cantidad FROM reserva_items WHERE id = $1', [alimentoId]);
    if (itemExistenteRes.rows.length > 0) {
      const nuevaCantidadItem = Number(itemExistenteRes.rows[0].cantidad) + cantidad;
      await client.query('UPDATE reserva_items SET cantidad = $1 WHERE id = $2', [nuevaCantidadItem, alimentoId]);
    } else {
      await client.query('INSERT INTO reserva_items (id, cantidad) VALUES ($1, $2)', [alimentoId, cantidad]);
    }

    // Actualizar saldo y total del usuario
    saldoActual = Number((saldoActual - costoOperacion).toFixed(2));
    totalActual = Number((totalActual + costoOperacion).toFixed(2));
    await client.query('UPDATE reserva_usuario SET saldo = $1, total = $2 WHERE id = 1', [saldoActual, totalActual]);

    const estadoActualizado = await obtenerEstadoReservaDB(client);
    await client.query('COMMIT');

    return res.status(200).json({
      mensaje: 'Platillo añadido a la reserva',
      ...estadoActualizado
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/reserva/agregar:', error.message);
    return res.status(500).json({ error: 'Error interno al agregar platillo a la reserva' });
  } finally {
    client.release();
  }
};

// 4. PUT /api/reserva/actualizar-porciones/:id -> Sube o baja la cantidad de porciones desde el carrito
const actualizarPorciones = async (req, res) => {
  const alimentoId = Number(req.params.id);
  const nuevaCantidad = Number(req.body.cantidad);

  if (Number.isNaN(alimentoId) || Number.isNaN(nuevaCantidad) || nuevaCantidad < 0) {
    return res.status(400).json({ error: 'Parámetros de actualización inválidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar que el plato esté actualmente en la reserva del usuario
    const itemRes = await client.query('SELECT id, cantidad FROM reserva_items WHERE id = $1 FOR UPDATE', [alimentoId]);
    if (itemRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'El platillo no se encuentra en tu bandeja de reserva' });
    }

    const cantidadActual = Number(itemRes.rows[0].cantidad);
    const diferenciaPorciones = nuevaCantidad - cantidadActual; // Positivo = subir porciones, Negativo = bajar porciones

    // Obtener información del plato y del usuario
    const platoRes = await client.query('SELECT id, nombre, precio, stock, categoria FROM menu WHERE id = $1 FOR UPDATE', [alimentoId]);
    const plato = formatearPlatoMenu(platoRes.rows[0]);

    const usuarioRes = await client.query('SELECT saldo, total FROM reserva_usuario WHERE id = 1 FOR UPDATE');
    let saldoActual = Number(usuarioRes.rows[0].saldo);
    let totalActual = Number(usuarioRes.rows[0].total);

    // Si el usuario incrementa porciones (diferenciaPorciones > 0), validamos stock y saldo
    if (diferenciaPorciones > 0) {
      const costoAdicional = Number((diferenciaPorciones * plato.precio).toFixed(2));

      // Validación Didáctica: Si al subir porciones supera el saldo del usuario -> 400
      if (costoAdicional > saldoActual) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Saldo insuficiente para esta cantidad' });
      }

      // Validación de Stock en cocina -> 400
      if (diferenciaPorciones > plato.stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Stock insuficiente' });
      }
    }

    // Calculamos nuevos valores de stock, saldo y total
    const nuevoStock = plato.stock - diferenciaPorciones;
    const ajusteFinanciero = Number((diferenciaPorciones * plato.precio).toFixed(2));
    saldoActual = Number((saldoActual - ajusteFinanciero).toFixed(2));
    totalActual = Number((totalActual + ajusteFinanciero).toFixed(2));

    // Actualizamos el stock del menú
    await client.query('UPDATE menu SET stock = $1 WHERE id = $2', [nuevoStock, alimentoId]);

    // Si la nueva cantidad llega a 0, eliminamos el ítem del carrito; si es mayor a 0, actualizamos
    if (nuevaCantidad === 0) {
      await client.query('DELETE FROM reserva_items WHERE id = $1', [alimentoId]);
    } else {
      await client.query('UPDATE reserva_items SET cantidad = $1 WHERE id = $2', [nuevaCantidad, alimentoId]);
    }

    // Actualizamos saldo y total del usuario
    await client.query('UPDATE reserva_usuario SET saldo = $1, total = $2 WHERE id = 1', [saldoActual, totalActual]);

    const estadoActualizado = await obtenerEstadoReservaDB(client);
    await client.query('COMMIT');

    return res.status(200).json({
      mensaje: 'Porciones actualizadas correctamente',
      ...estadoActualizado
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en PUT /api/reserva/actualizar-porciones/:id:', error.message);
    return res.status(500).json({ error: 'Error interno al actualizar las porciones' });
  } finally {
    client.release();
  }
};

// 5. DELETE /api/reserva/eliminar/:id -> Elimina el platillo de la reserva y devuelve stock y saldo
const eliminarPlatoReserva = async (req, res) => {
  const alimentoId = Number(req.params.id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener todas las filas de reserva_items y usar .find() y .filter() para demostrar manejo de arreglos
    const itemsRes = await client.query('SELECT id, cantidad FROM reserva_items FOR UPDATE');
    const listaItems = itemsRes.rows.map((r) => ({ id: Number(r.id), cantidad: Number(r.cantidad) }));

    const itemAEliminar = listaItems.find((item) => item.id === alimentoId);
    if (!itemAEliminar) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'El platillo no existe en la reserva actual' });
    }

    // Filtramos los ítems restantes (demostración explícita de .filter())
    const itemsRestantes = listaItems.filter((item) => item.id !== alimentoId);

    // Consultar el plato en el menú para conocer su precio y devolver las unidades al stock
    const platoRes = await client.query('SELECT precio, stock FROM menu WHERE id = $1 FOR UPDATE', [alimentoId]);
    const precioPlato = Number(platoRes.rows[0].precio);
    const stockActual = Number(platoRes.rows[0].stock);

    const stockDevuelto = stockActual + itemAEliminar.cantidad;
    const montoReembolso = Number((precioPlato * itemAEliminar.cantidad).toFixed(2));

    // Devolver unidades al stock del menú general
    await client.query('UPDATE menu SET stock = $1 WHERE id = $2', [stockDevuelto, alimentoId]);

    // Eliminar el platillo de la reserva del usuario
    await client.query('DELETE FROM reserva_items WHERE id = $1', [alimentoId]);

    // Reintegrar dinero al saldo del usuario y descontar del total
    const usuarioRes = await client.query('SELECT saldo, total FROM reserva_usuario WHERE id = 1 FOR UPDATE');
    const nuevoSaldo = Number((Number(usuarioRes.rows[0].saldo) + montoReembolso).toFixed(2));
    const nuevoTotal = Math.max(0, Number((Number(usuarioRes.rows[0].total) - montoReembolso).toFixed(2)));

    await client.query('UPDATE reserva_usuario SET saldo = $1, total = $2 WHERE id = 1', [nuevoSaldo, nuevoTotal]);

    await client.query('COMMIT');

    return res.status(200).json({
      mensaje: 'Platillo eliminado de la reserva y stock restaurado',
      saldo: nuevoSaldo,
      itemsReservados: itemsRestantes,
      total: nuevoTotal
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en DELETE /api/reserva/eliminar/:id:', error.message);
    return res.status(500).json({ error: 'Error interno al eliminar el platillo de la reserva' });
  } finally {
    client.release();
  }
};

// AUXILIAR 1: POST /api/reserva/confirmar -> Confirma la reserva (bloquea definitivamente el stock y limpia la bandeja)
const confirmarReserva = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const itemsRes = await client.query('SELECT id, cantidad FROM reserva_items');
    if (itemsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No tienes platillos en la bandeja para confirmar' });
    }

    // Limpiamos la bandeja activa y reiniciamos el contador de "Total de tu Reserva" a 0.00
    // El stock ya quedó descontado en el menú y el saldo ya fue debitado
    await client.query('DELETE FROM reserva_items');
    await client.query('UPDATE reserva_usuario SET total = 0.00 WHERE id = 1');

    const estadoActualizado = await obtenerEstadoReservaDB(client);
    await client.query('COMMIT');

    return res.status(200).json({
      mensaje: '¡Reserva confirmada con éxito! El stock ha sido bloqueado para tu almuerzo.',
      ...estadoActualizado
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/reserva/confirmar:', error.message);
    return res.status(500).json({ error: 'Error interno al confirmar la reserva' });
  } finally {
    client.release();
  }
};

// AUXILIAR 2: POST /api/reserva/expirar -> Cancela la reserva por límite de tiempo y devuelve stock y saldo
const expirarReserva = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const itemsRes = await client.query(`
      SELECT ri.id, ri.cantidad, m.precio
      FROM reserva_items ri
      INNER JOIN menu m ON ri.id = m.id
      FOR UPDATE
    `);

    let reembolsoTotal = 0;

    // Devolvemos cada porción al inventario general de cocina
    for (const item of itemsRes.rows) {
      const cantidad = Number(item.cantidad);
      const precio = Number(item.precio);
      reembolsoTotal += cantidad * precio;

      await client.query('UPDATE menu SET stock = stock + $1 WHERE id = $2', [cantidad, item.id]);
    }

    // Vaciamos la bandeja activa y devolvemos el dinero al saldo del usuario
    await client.query('DELETE FROM reserva_items');
    await client.query(
      'UPDATE reserva_usuario SET saldo = ROUND((saldo + $1)::numeric, 2), total = 0.00 WHERE id = 1',
      [reembolsoTotal]
    );

    const estadoActualizado = await obtenerEstadoReservaDB(client);
    await client.query('COMMIT');

    return res.status(200).json({
      mensaje: 'El tiempo de reserva ha expirado. Se liberó el stock y se restauró tu saldo.',
      ...estadoActualizado
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/reserva/expirar:', error.message);
    return res.status(500).json({ error: 'Error al expirar la reserva' });
  } finally {
    client.release();
  }
};

module.exports = {
  obtenerMenu,
  obtenerReserva,
  agregarPlatoReserva,
  actualizarPorciones,
  eliminarPlatoReserva,
  confirmarReserva,
  expirarReserva
};