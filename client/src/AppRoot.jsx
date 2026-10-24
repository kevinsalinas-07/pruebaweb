// client/src/AppRoot.jsx
import React, { useState } from 'react';
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
  Button,
  Container
} from 'reactstrap';

import HomePage from './pages/HomePage.jsx';
import JuegoPage from './pages/JuegoPage.jsx';
import FoodDeiPage from './pages/FoodDeiPage.jsx';
import UserDev from './pages/UserDev.jsx';

export default function AppRoot() {
  // Estado para controlar la pestaña activa ('home' | 'juego' | 'food' | 'equipo')
  const [paginaActiva, setPaginaActiva] = useState('home');

  const renderizarPagina = () => {
    switch (paginaActiva) {
      case 'juego':
        return <JuegoPage />;
      case 'food':
        return <FoodDeiPage />;
      case 'equipo':
        return <UserDev />;
      default:
        return <HomePage cambiarPagina={setPaginaActiva} />;
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar color="dark" dark expand="md" className="px-3 shadow-sm">
        <NavbarBrand
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            setPaginaActiva('home');
          }}
          className="fw-bold"
        >
          🌐 Evaluación II - Programación Web
        </NavbarBrand>

        <Nav className="ms-auto d-flex flex-row gap-2" navbar>
          <NavItem>
            <Button
              color={paginaActiva === 'home' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setPaginaActiva('home')}
            >
              Inicio
            </Button>
          </NavItem>
          <NavItem>
            <Button
              color={paginaActiva === 'juego' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setPaginaActiva('juego')}
            >
              Ejercicio 1: Adivina el Número
            </Button>
          </NavItem>
          <NavItem>
            <Button
              color={paginaActiva === 'food' ? 'success' : 'secondary'}
              size="sm"
              onClick={() => setPaginaActiva('food')}
            >
              Ejercicio 2: Food DEI S.A.
            </Button>
          </NavItem>
          <NavItem>
            <Button
              color={paginaActiva === 'equipo' ? 'info' : 'secondary'}
              size="sm"
              onClick={() => setPaginaActiva('equipo')}
            >
              Equipo Dev
            </Button>
          </NavItem>
        </Nav>
      </Navbar>

      <Container className="py-4 flex-grow-1">
        {renderizarPagina()}
      </Container>
    </div>
  );
}