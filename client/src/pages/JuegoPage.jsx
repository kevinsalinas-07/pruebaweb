// client/src/pages/JuegoPage.jsx
import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  ListGroup,
  ListGroupItem,
  Badge
} from 'reactstrap';
import { enviarIntentoApi, reiniciarJuegoApi } from '../api/juegoApi';

export default function JuegoPage() {
  // Estados requeridos por la rúbrica (useState con string, array y boolean)
  const [numeroInput, setNumeroInput] = useState('');
  const [intentos, setIntentos] = useState([]); // Historial de todos los números intentados
  const [mensajeServidor, setMensajeServidor] = useState('Ingresa un número entre 1 y 100 para comenzar.');
  const [gano, setGano] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');

  // Manejo del envío del intento al endpoint POST /guess
  const manejarIntento = async (e) => {
    e.preventDefault();
    setErrorValidacion('');

    const valorNumerico = Number(numeroInput);
    if (!numeroInput || Number.isNaN(valorNumerico) || valorNumerico < 1 || valorNumerico > 100) {
      setErrorValidacion('Por favor, ingresa un número válido entre 1 y 100.');
      return;
    }

    try {
      setCargando(true);
      const respuesta = await enviarIntentoApi(valorNumerico);

      // Actualizamos el mensaje del servidor y el estado booleano si ganó
      setMensajeServidor(respuesta.mensaje);
      setGano(Boolean(respuesta.acertado));

      // Agregamos el intento al arreglo de historial usando inmutabilidad
      const nuevoIntento = {
        id: intentos.length + 1,
        numero: valorNumerico,
        pista: respuesta.resultado // "mayor", "menor" o "correcto"
      };
      setIntentos((prevIntentos) => [nuevoIntento, ...prevIntentos]);
      setNumeroInput('');
    } catch (error) {
      setErrorValidacion(error.message);
    } finally {
      setCargando(false);
    }
  };

  // Manejo del reinicio de partida (POST /reset)
  const manejarReinicio = () => {
    setCargando(true);
    setErrorValidacion('');

    reiniciarJuegoApi()
      .then((datos) => {
        setIntentos([]);
        setGano(false);
        setNumeroInput('');
        setMensajeServidor(datos.mensaje);
      })
      .catch((error) => {
        setErrorValidacion(error.message);
      })
      .finally(() => {
        setCargando(false);
      });
  };

  // Uso de .filter() para contar únicamente los intentos fallidos
  const intentosFallidos = intentos.filter((item) => item.pista !== 'correcto');

  return (
    <Row className="justify-content-center">
      <Col xs="12" md="6" className="mb-4">
        <Card className="shadow-sm">
          <CardBody>
            <CardTitle tag="h4" className="fw-bold mb-3">
              🎲 Ejercicio 1: Adivina el Número (1 - 100)
            </CardTitle>

            {errorValidacion && (
              <Alert color="warning" className="fw-semibold">
                ⚠️ {errorValidacion}
              </Alert>
            )}

            <Alert color={gano ? 'success' : 'info'} className="fw-semibold">
              {mensajeServidor}
            </Alert>

            <Form onSubmit={manejarIntento}>
              <FormGroup>
                <Label for="inputNumero" className="fw-bold">
                  Tu número:
                </Label>
                <Input
                  id="inputNumero"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Ej. 50"
                  value={numeroInput}
                  onChange={(e) => setNumeroInput(e.target.value)}
                  disabled={gano || cargando}
                />
              </FormGroup>

              <div className="d-flex gap-2">
                <Button
                  color="primary"
                  type="submit"
                  disabled={gano || cargando}
                  className="flex-grow-1"
                >
                  {cargando ? 'Verificando...' : 'Probar Número'}
                </Button>

                <Button
                  color="secondary"
                  type="button"
                  outline
                  onClick={manejarReinicio}
                  disabled={cargando}
                >
                  Reiniciar Partida
                </Button>
              </div>
            </Form>
          </CardBody>
        </Card>
      </Col>

      <Col xs="12" md="6">
        <Card className="shadow-sm">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <CardTitle tag="h5" className="fw-bold mb-0">
                📜 Historial de Intentos
              </CardTitle>
              <div>
                <Badge color="danger" className="me-1">
                  Fallidos: {intentosFallidos.length}
                </Badge>
                <Badge color="dark">Total: {intentos.length}</Badge>
              </div>
            </div>

            {intentos.length === 0 ? (
              <p className="text-muted mb-0">
                Aún no has realizado ningún intento en esta sesión.
              </p>
            ) : (
              <ListGroup flush>
                {intentos.map((item) => (
                  <ListGroupItem
                    key={item.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>
                      Intento #{item.id}: <strong>{item.numero}</strong>
                    </span>
                    <Badge
                      color={
                        item.pista === 'correcto'
                          ? 'success'
                          : item.pista === 'mayor'
                          ? 'primary'
                          : 'warning'
                      }
                      pill
                    >
                      {item.pista === 'correcto'
                        ? '¡Correcto!'
                        : `El oculto es ${item.pista}`}
                    </Badge>
                  </ListGroupItem>
                ))}
              </ListGroup>
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
}