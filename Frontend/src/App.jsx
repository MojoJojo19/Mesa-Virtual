import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Ingreso from './pages/Ingreso'
import Lobby from './pages/Lobby'
import Menu from './pages/Menu'
import Resumen from './pages/Resumen'

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Navigate to="/mesa/1" replace />} />
        <Route path="/mesa/:idMesa" element={<Ingreso />} />
        <Route path="/mesa/:idMesa/lobby" element={<Lobby />} />
        <Route path="/mesa/:idMesa/menu" element={<Menu />} />
        <Route path="/mesa/:idMesa/resumen" element={<Resumen />} />
      </Routes>
    </div>
  )
}

export default App
