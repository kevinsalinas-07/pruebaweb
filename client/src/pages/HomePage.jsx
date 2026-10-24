// client/src/pages/HomePage.jsx
import React from 'react';
import { Row, Col, Card, CardBody, CardTitle, CardText, Button, Badge } from 'reactstrap';

export default function HomePage({ cambiarPagina }) {
  return (
    <div>
      <div className="p-4 mb-4 bg-white rounded-3 shadow-sm border">
        <Badge color="primary" className="mb-2">Ciclo 02, 2026 - UCA</Badge>
        <h2 className="fw-bold">Evaluación II: Integración Frontend - Backend</h2>
        <p className="text-muted mb-0">
          Solución Full-Stack desarrollada con Node.js, Express, PostgreSQL (Neon.tech) y React (Vite + Reactstrap).
        </p>
      </div>

      <Row>
        <Col xs="12" md="6" className="mb-3">
          <Card className="h-100 shadow-sm">
            <CardBody className="d-flex flex-column">
              <CardTitle tag="h4" className="fw-bold text-primary">
                🎯 Ejercicio 1: Adivina el Número
              </CardTitle>
              <CardText className="flex-grow-1">
                Juego interactivo conectado a Express mediante los endpoints <code>POST /guess</code> y{' '}
                <code>POST /reset</code>. Evalúa si el número oculto (1-100) es mayor, menor o correcto y
                conserva el historial dinámico de intentos.
              </CardText>
              <Button color="primary" onClick={() => cambiarPagina('juego')}>
                Abrir Ejercicio 1
              </Button>
            </CardBody>
          </Card>
        </Col>

        <Col xs="12" md="6" className="mb-3">
          <Card className="h-100 shadow-sm">
            <CardBody className="d-flex flex-column">
              <CardTitle tag="h4" className="fw-bold text-success">
                🍽️ Ejercicio 2: Food DEI S.A. de R.L.
              </CardTitle>
              <CardText className="flex-grow-1">
                Sistema de reservas de almuerzo con control de stock en tiempo real en PostgreSQL, validación
                de presupuesto ($25.00), carrito lateral interactivo y temporizador de expiración automática.
              </CardText>
              <Button color="success" onClick={() => cambiarPagina('food')}>
                Abrir Caso Food DEI
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
}