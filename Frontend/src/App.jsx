import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Bienvenida      from './pages/Bienvenida'
import PinIngreso      from './pages/PinIngreso'
import AccesoConfirmado from './pages/AccesoConfirmado'
import Ingreso         from './pages/Ingreso'
import Lobby           from './pages/Lobby'
import ModoPago        from './pages/ModoPago'
import Menu            from './pages/Menu'
import PedidoGrupal    from './pages/PedidoGrupal'
import PedidoEnviado   from './pages/PedidoEnviado'
import Resumen         from './pages/Resumen'
import Logistica       from './pages/Logistica'
import SelectorRol     from './pages/SelectorRol'

function AppInner() {
  return (
    <div className="app-container">
      {/* Cada pantalla dibuja su propia cabecera y su barra de pasos. */}
      <Routes>
        <Route path="/"                          element={<SelectorRol />} />
        <Route path="/mesa/:idMesa"              element={<Bienvenida />} />
        <Route path="/mesa/:idMesa/pin"          element={<PinIngreso />} />
        <Route path="/mesa/:idMesa/acceso"       element={<AccesoConfirmado />} />
        <Route path="/mesa/:idMesa/ingreso"      element={<Ingreso />} />
        <Route path="/mesa/:idMesa/lobby"        element={<Lobby />} />
        <Route path="/mesa/:idMesa/pago-modo"    element={<ModoPago />} />
        <Route path="/mesa/:idMesa/menu"         element={<Menu />} />
        <Route path="/mesa/:idMesa/pedido-grupo" element={<PedidoGrupal />} />
        <Route path="/mesa/:idMesa/confirmado"   element={<PedidoEnviado />} />
        <Route path="/mesa/:idMesa/resumen"      element={<Resumen />} />
        <Route path="/logistica"                 element={<Logistica />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}

export default App
