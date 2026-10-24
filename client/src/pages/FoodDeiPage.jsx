// client/src/pages/FoodDeiPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Alert,
  UncontrolledAlert,
  Badge,
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  CardText,
  Button,
  ButtonGroup,
  ListGroup,
  ListGroupItem,
  Spinner
} from 'reactstrap';
import {
  obtenerMenuApi,
  obtenerReservaApi,
  agregarPlatoApi,
  actualizarPorcionesApi,
  eliminarPlatoApi,
  confirmarReservaApi,
  expirarReservaApi
} from '../api/foodDeiApi';

const TIEMPO_LIMITE_SEGUNDOS = 120; // 2 minutos para completar la reserva

export default function FoodDeiPage() {
  // Estados principales con arreglos, números, booleanos y strings
  const [menu, setMenu] = useState([]);
  const [saldo, setSaldo] = useState(25.0);
  const [itemsReservados, setItemsReservados] = useState([]);
  const [totalReserva, setTotalReserva] = useState(0.0);

  // Estados de interfaz (carga, alertas de error de negocio, confirmación y temporizador)
  const [cargando, setCargando] = useState(false);
  const [errorNegocio, setErrorNegocio] = useState(null); // { id, mensaje }
  const [mensajeExito, setMensajeExito] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState(TIEMPO_LIMITE_SEGUNDOS);
  const [reservaExpirada, setReservaExpirada] = useState(false);

  // Función modular para sincronizar el menú (Endpoint 1) y la reserva (Endpoint 2)
  const cargarDatosServidor = async () => {
    try {
      setCargando(true);
      const [datosMenu, datosReserva] = await Promise.all([
        obtenerMenuApi(),
        obtenerReservaApi()
      ]);

      setMenu(datosMenu);
      setSaldo(Number(datosReserva.saldo));
      setItemsReservados(datosReserva.itemsReservados || []);
      setTotalReserva(Number(datosReserva.total));
    } catch (error) {
      setErrorNegocio({ id: Date.now(), mensaje: error.message });
    } finally {
      setCargando(false);
    }
  };

  // Carga inicial al montar el componente
  useEffect(() => {
    cargarDatosServidor();
  }, []);

  // Hook useEffect para el límite de tiempo de la reserva
  useEffect(() => {
    if (reservaExpirada) return;

    const intervalo = setInterval(() => {
      setSegundosRestantes((prevSegundos) => {
        if (prevSegundos <= 1) {
          clearInterval(intervalo);
          manejarExpiracionTiempo();
          return 0;
        }
        return prevSegundos - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [reservaExpirada]);

  // Cuando el temporizador llega a 0, cierra la reserva y devuelve el stock al backend
  const manejarExpiracionTiempo = async () => {
    try {
      setCargando(true);
      setReservaExpirada(true);
      await expirarReservaApi();
      await cargarDatosServidor();
    } catch (error) {
      setErrorNegocio({ id: Date.now(), mensaje: error.message });
    } finally {
      setCargando(false);
    }
  };

  // Permite iniciar nuevamente la reserva tras expirar el tiempo límite
  const iniciarNuevaReserva = () => {
    setReservaExpirada(false);
    setErrorNegocio(null);
    setMensajeExito('');
    setSegundosRestantes(TIEMPO_LIMITE_SEGUNDOS);
    cargarDatosServidor();
  };

  // Dispara Endpoint 3: POST /api/reserva/agregar
  const manejarAgregarPlato = async (alimentoId) => {
    setErrorNegocio(null);
    setMensajeExito('');
    try {
      setCargando(true);
      await agregarPlatoApi(alimentoId, 1);
      await cargarDatosServidor();
    } catch (error) {
      // Captura el 400 Bad Request y lo muestra en <UncontrolledAlert color="warning">
      setErrorNegocio({ id: Date.now(), mensaje: error.message });
    } finally {
      setCargando(false);
    }
  };

  // Dispara Endpoint 4: PUT /api/reserva/actualizar-porciones/:id
  const manejarCambioPorciones = async (alimentoId, nuevaCantidad) => {
    setErrorNegocio(null);
    setMensajeExito('');
    try {
      setCargando(true);
      if (nuevaCantidad <= 0) {
        // Si baja a 0 porciones, eliminamos el plato del carrito
        await eliminarPlatoApi(alimentoId);
      } else {
        await actualizarPorcionesApi(alimentoId, nuevaCantidad);
      }
      await cargarDatosServidor();
    } catch (error) {
      setErrorNegocio({ id: Date.now(), mensaje: error.message });
    } finally {
      setCargando(false);
    }
  };

  // Dispara Endpoint 5: DELETE /api/reserva/eliminar/:id
  const manejarEliminarPlato = async (alimentoId) => {
    setErrorNegocio(null);
    setMensajeExito('');
    try {
      setCargando(true);
      await eliminarPlatoApi(alimentoId);
      await cargarDatosServidor();
    } catch (error) {
      setErrorNegocio({ id: Date.now(), mensaje: error.message });
    } finally {
      setCargando(false);
    }
  };

  // Confirmar la reserva dentro del tiempo límite
  const manejarConfirmarReserva = async () => {
    setErrorNegocio(null);
    try {
      setCargando(true);
      const respuesta = await confirmarReservaApi();
      setMensajeExito(respuesta.mensaje);
      setSegundosRestantes(TIEMPO_LIMITE_SEGUNDOS);
      await cargarDatosServidor();
    } catch (error) {
      setErrorNegocio({ id: Date.now(), mensaje: error.message });
    } finally {
      setCargando(false);
    }
  };

  // Formateador de segundos a MM:SS
  const formatearTiempo = (totalSegundos) => {
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  };

  return (
    <div>
      {/* 1. Alerta superior obligatoria para errores de negocio (400 Bad Request) */}
      {errorNegocio && (
        <UncontrolledAlert key={errorNegocio.id} color="warning" className="shadow-sm fw-semibold">
          ⚠️ <strong>Regla de negocio:</strong> {errorNegocio.mensaje}
        </UncontrolledAlert>
      )}

      {mensajeExito && (
        <Alert color="success" className="shadow-sm fw-semibold">
          ✅ {mensajeExito}
        </Alert>
      )}

      {/* 2. Panel Superior Fijo (Información del Usuario, Presupuesto y Total de Reserva) */}
      <Alert
        color="info"
        className="panel-fijo-superior d-flex flex-wrap justify-content-between align-items-center shadow-sm mb-4"
      >
        <div className="fw-bold fs-5">
          💰 Tu saldo actual: ${saldo.toFixed(2)}
        </div>

        <div className="d-flex align-items-center gap-3">
          {cargando && (
            <span className="text-primary fw-bold d-flex align-items-center gap-1">
              <Spinner size="sm" color="primary" /> Cargando...
            </span>
          )}

          <Badge color={segundosRestantes <= 20 ? 'danger' : 'primary'} className="p-2 fs-6">
            ⏱️ Tiempo restante: {formatearTiempo(segundosRestantes)}
          </Badge>

          <Badge color="dark" pill className="p-2 fs-6">
            Total de tu Reserva: ${totalReserva.toFixed(2)}
          </Badge>
        </div>
      </Alert>

      {/* 3. Vista de Reserva Cerrada si se agotó el tiempo límite */}
      {reservaExpirada ? (
        <Card className="text-center p-4 shadow-sm border-danger my-4">
          <CardBody>
            <CardTitle tag="h3" className="text-danger fw-bold">
              ⏰ Tiempo de Reserva Agotado
            </CardTitle>
            <CardText className="text-muted fs-5 my-3">
              No completaste tu reserva dentro del tiempo límite. Para evitar el desperdicio de alimentos,
              las porciones de tu bandeja fueron devueltas al inventario y tu saldo ha sido restaurado.
            </CardText>
            <Button color="primary" size="lg" onClick={iniciarNuevaReserva}>
              Iniciar Reserva Nuevamente
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Row>
          {/* ZONA 1: El Menú del Día (Catálogo de Selección) - Consume Endpoints 1 y 3 */}
          <Col xs="12" lg="8">
            <h4 className="fw-bold mb-3">🍲 El Menú del Día (Catálogo de Selección)</h4>
            <Row>
              {menu.map((plato) => (
                <Col xs="12" md="4" key={plato.id}>
                  <Card className="mb-3 card-plato h-100 shadow-sm">
                    <CardBody className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <CardSubtitle className="text-muted small text-uppercase fw-bold">
                          {plato.categoria}
                        </CardSubtitle>
                        <Badge color="success" className="fs-6">
                          ${Number(plato.precio).toFixed(2)}
                        </Badge>
                      </div>

                      <CardTitle tag="h5" className="fw-bold">
                        {plato.nombre}
                      </CardTitle>

                      <CardText className="mt-auto mb-3">
                        Stock disponible:{' '}
                        <strong className={plato.stock === 0 ? 'text-danger' : 'text-dark'}>
                          {plato.stock} porciones
                        </strong>
                      </CardText>

                      {plato.stock === 0 ? (
                        <Button color="secondary" disabled className="w-100">
                          Agotado
                        </Button>
                      ) : (
                        <Button
                          color="primary"
                          className="w-100"
                          disabled={cargando}
                          onClick={() => manejarAgregarPlato(plato.id)}
                        >
                          Añadir a la Reserva
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>

          {/* ZONA 2: Tu Bandeja de Reserva (El Carrito Lateral) - Consume Endpoints 2, 4 y 5 */}
          <Col xs="12" lg="4">
            <h4 className="fw-bold mb-3">🛒 Tu Bandeja de Reserva</h4>
            <Card className="shadow-sm">
              <CardBody>
                {itemsReservados.length === 0 ? (
                  <p className="text-muted text-center my-3">
                    Tu bandeja está vacía. Selecciona platillos del menú del día.
                  </p>
                ) : (
                  <>
                    <ListGroup className="mb-3">
                      {itemsReservados.map((item) => {
                        // Uso de .find() sobre el arreglo menu para obtener el nombre y precio del plato
                        const detallePlato = menu.find((p) => p.id === item.id);
                        const nombrePlato = detallePlato ? detallePlato.nombre : `Plato #${item.id}`;
                        const subtotalPlato = detallePlato
                          ? (detallePlato.precio * item.cantidad).toFixed(2)
                          : '0.00';

                        return (
                          <ListGroupItem
                            key={item.id}
                            className="d-flex flex-column gap-2"
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold">{nombrePlato}</span>
                              <Badge color="secondary" pill>
                                ${subtotalPlato}
                              </Badge>
                            </div>

                            <div className="d-flex justify-content-between align-items-center">
                              {/* Control de porciones compacto con <ButtonGroup size="sm"> */}
                              <div className="d-flex align-items-center gap-2">
                                <ButtonGroup size="sm">
                                  <Button
                                    color="dark"
                                    outline
                                    disabled={cargando}
                                    onClick={() =>
                                      manejarCambioPorciones(item.id, item.cantidad - 1)
                                    }
                                  >
                                    -
                                  </Button>
                                  <Button color="light" disabled className="fw-bold text-dark px-3">
                                    {item.cantidad}
                                  </Button>
                                  <Button
                                    color="dark"
                                    outline
                                    disabled={cargando}
                                    onClick={() =>
                                      manejarCambioPorciones(item.id, item.cantidad + 1)
                                    }
                                  >
                                    +
                                  </Button>
                                </ButtonGroup>
                              </div>

                              {/* Botón final conectado al Endpoint 5 (DELETE) */}
                              <Button
                                color="danger"
                                outline
                                size="sm"
                                disabled={cargando}
                                onClick={() => manejarEliminarPlato(item.id)}
                              >
                                Quitar
                              </Button>
                            </div>
                          </ListGroupItem>
                        );
                      })}
                    </ListGroup>

                    <Button
                      color="success"
                      className="w-100 fw-bold"
                      disabled={cargando}
                      onClick={manejarConfirmarReserva}
                    >
                      Confirmar Reserva (${totalReserva.toFixed(2)})
                    </Button>
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}