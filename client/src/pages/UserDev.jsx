// client/src/pages/UserDev.jsx
import React from 'react';
import { Row, Col, Card, CardBody, CardTitle, CardSubtitle, Badge } from 'reactstrap';

const integrantesEquipo = [
  {
    id: 1,
    nombre: 'Kevin Adolfo Gutiérrez Salinas',
    rol: 'Arquitectura Full-Stack, Base de Datos PostgreSQL (Neon.tech) y API REST',
    ramaGit: 'feature/backend-postgres-api'
  },
  {
    id: 2,
    nombre: 'Integrante 2 (Editar Nombre)',
    rol: 'Backend Express - Controladores y Validaciones de Reglas de Negocio',
    ramaGit: 'feature/reserva-controllers'
  },
  {
    id: 3,
    nombre: 'Integrante 3 (Editar Nombre)',
    rol: 'Frontend React + Reactstrap - Caso Food DEI S.A. de R.L.',
    ramaGit: 'feature/frontend-food-dei'
  },
  {
    id: 4,
    nombre: 'Integrante 4 (Editar Nombre)',
    rol: 'Frontend React - Ejercicio 1 (Adivina el Número) y Consumo de Promesas',
    ramaGit: 'feature/frontend-juego'
  }
];

export default function UserDev() {
  return (
    <div>
      <h3 className="fw-bold mb-3">👨‍💻 Equipo de Desarrollo - Ciclo 02, 2026</h3>
      <Row>
        {integrantesEquipo.map((dev) => (
          <Col xs="12" md="6" key={dev.id} className="mb-3">
            <Card className="shadow-sm h-100">
              <CardBody>
                <Badge color="dark" className="mb-2">
                  Integrante #{dev.id}
                </Badge>
                <CardTitle tag="h5" className="fw-bold">
                  {dev.nombre}
                </CardTitle>
                <CardSubtitle className="text-muted mb-2">
                  {dev.rol}
                </CardSubtitle>
                <Badge color="info" pill>
                  Git Branch: {dev.ramaGit}
                </Badge>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}