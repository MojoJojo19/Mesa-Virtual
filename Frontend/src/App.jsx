import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import StepBar         from './components/StepBar'
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

function AppInner() {
  const location = useLocation()

  return (
    <div className="app-container">
      {/* StepBar is temporarily hidden for native feel, or we can leave it. I'll remove it from the global scope to let headers handle navigation natively. */}
      <Routes>
        <Route path="/"                          element={<Navigate to="/mesa/7" replace />} />
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
