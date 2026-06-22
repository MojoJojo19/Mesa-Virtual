import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Smartphone, CreditCard, Banknote } from 'lucide-react'
import { pedirCuenta, registrarPago, enviarPedido, getPedidosDeMesa } from '../services/api'
import { useToast } from '../components/Toast'

const METODOS_PAGO = [
  { id: 'yape', label: 'Yape / Plin', sub: 'Pago instantáneo por QR', icon: Smartphone, color: '#8b5cf6' },
  { id: 'tarjeta', label: 'Tarjeta', sub: 'Visa, Mastercard', icon: CreditCard, color: '#3b82f6' },
  { id: 'efectivo', label: 'Efectivo', sub: 'El mesero traerá el vuelto', icon: Banknote, color: '#10b981' }
]

export default function Resumen() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [metodoPago, setMetodoPago] = useState('yape')
  const [propinaIdx, setPropinaIdx] = useState(1) // 0=0%, 1=5%, 2=10%, 3=Otros
  const [propinaOtros, setPropinaOtros] = useState('')
  const [solicitando, setSolicitando] = useState(false)
  const [pagando, setPagando] = useState(false)

  const handlePedirCuenta = async () => {
    setSolicitando(true)
    try {
      await pedirCuenta(idMesa)
      toast('Solicitud de cuenta enviada al mozo.', 'success')
    } catch (e) {
      toast('Error al solicitar la cuenta', 'error')
    } finally {
      setSolicitando(false)
    }
  }

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{"nombre":"Carlos","isLider":true}')
  const isLider = user.isLider || false

  const miCarrito = JSON.parse(localStorage.getItem('swifttable_carrito') || '[]')
  const miTotal = miCarrito.reduce((s, p) => s + Number(p.precio || 0) * (p.cantidad || 1), 0)

  const pedidosMesa = [
    { nombre: user.nombre, isLider: user.isLider, precio: miTotal },
    { nombre: 'Ana', isLider: false, precio: 32.00 },
    { nombre: 'Luis', isLider: false, precio: 18.00 },
  ]

  const subtotal = (isLider && user.modoPago === 'lider')
    ? pedidosMesa.reduce((s, p) => s + p.precio, 0)
    : miTotal

  const servicio = subtotal * 0.10
  const pctPropina = propinaIdx === 0 ? 0 : propinaIdx === 1 ? 0.05 : propinaIdx === 2 ? 0.10 : 0
  const propinaMonto = propinaIdx === 3 ? (Number(propinaOtros) || 0) : (subtotal * pctPropina)
  const totalFinal = subtotal + servicio + propinaMonto

  const handlePagar = async () => {
    setPagando(true)
    try {
      let idPedido = localStorage.getItem('swifttable_id_pedido')
      
      if (!idPedido) {
        // Fallback: buscar pedidos pendientes de la mesa
        const peds = await getPedidosDeMesa(idMesa)
        const pedPendiente = peds && peds.find(p => p.estado === 'pendiente')
        if (pedPendiente) {
          idPedido = pedPendiente.id_pedido
        }
      }
      
      if (!idPedido) {
        // Fallback local en caso de pruebas directas sin pasar por menú
        const todosItems = miCarrito.map(c => ({ id_producto: c.id_producto, cantidad: c.cantidad }))
        if (todosItems.length === 0) {
          todosItems.push({ id_producto: 1, cantidad: 1 }) // fallback a un plato
        }
        const resPedido = await enviarPedido(idMesa, todosItems)
        idPedido = resPedido.id_pedido
      }
      
      await registrarPago(idPedido, totalFinal, propinaMonto, metodoPago)
      toast('Pago registrado y validado. Tu pedido ha sido enviado a la cocina.', 'success')
      
      // Limpiar datos temporales
      localStorage.removeItem('swifttable_carrito')
      localStorage.removeItem('swifttable_id_pedido')
      
      // Navegar a la pantalla de seguimiento de cocina
      navigate(`/mesa/${idMesa}/confirmado`)
    } catch (err) {
      toast('Error al registrar el pago', 'error')
    } finally {
      setPagando(false)
    }
  }

  const restName = localStorage.getItem('swifttable_nombre_restaurante') || 'SwiftTable'

  return (
    <>
      <div className="native-app-bar">
        <div className="left-action">
          <button className="wf-btn-ghost" onClick={() => navigate(-1)} style={{ padding: 0 }}>
            <ChevronLeft size={28} color="var(--accent)" />
          </button>
        </div>
        <div className="title">{restName}</div>
        <div className="right-action"></div>
      </div>

      <div className="content-wrapper">

        <div style={{ padding: '24px 0 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', color: 'var(--text-2)' }}>Total a Pagar</div>
          <div style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-0.03em' }}>
            S/ {totalFinal.toFixed(2)}
          </div>
        </div>

        {/* Desglose */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
            <span style={{ color: 'var(--text-2)' }}>Subtotal</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
            <span style={{ color: 'var(--text-2)' }}>Servicio (10%)</span>
            <span>S/ {servicio.toFixed(2)}</span>
          </div>
          {propinaMonto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
              <span style={{ color: 'var(--text-2)' }}>Propina {propinaIdx === 3 ? '(Otros)' : `(${(pctPropina * 100).toFixed(0)}%)`}</span>
              <span>S/ {propinaMonto.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="section-label">Propina sugerida</div>
        <div className="segmented-control" style={{ marginBottom: propinaIdx === 3 ? '12px' : '0px' }}>
          {[0, 0.05, 0.10, 'otro'].map((val, idx) => (
            <div
              key={idx}
              className={`segment-btn ${propinaIdx === idx ? 'active' : ''}`}
              onClick={() => setPropinaIdx(idx)}
            >
              {val === 0 ? 'Nada' : val === 'otro' ? 'Otros' : `${val * 100}%`}
            </div>
          ))}
        </div>

        {propinaIdx === 3 && (
          <div className="animate-fade-in" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-2)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Monto de Propina personalizado (S/)
            </label>
            <input
              type="number"
              min="0"
              step="0.10"
              placeholder="0.00"
              value={propinaOtros}
              onChange={(e) => setPropinaOtros(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1.5px solid var(--border-2)',
                borderRadius: '12px',
                color: 'var(--text-1)',
                padding: '14px 16px',
                fontSize: '16px',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <div className="section-label" style={{ marginTop: '24px' }}>Método de pago</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {METODOS_PAGO.map(m => {
            const isSelected = metodoPago === m.id
            return (
              <div
                key={m.id}
                className={`pago-option ${isSelected ? 'selected' : ''}`}
                onClick={() => setMetodoPago(m.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <m.icon size={24} color={isSelected ? m.color : 'var(--text-3)'} />
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{m.label}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{m.sub}</div>
                  </div>
                </div>
                <div className="pago-option-radio" />
              </div>
            )
          })}
        </div>
      </div>

      <div className="native-bottom-bar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
        <button
          className="wf-btn-outline"
          style={{ width: '100%', padding: '16px', fontSize: '16px' }}
          onClick={handlePedirCuenta}
          disabled={solicitando}
        >
          {solicitando ? 'Enviando...' : 'Pedir Cuenta al Mozo'}
        </button>
        <button
          className="wf-btn-solid"
          style={{ width: '100%', padding: '16px', margin: 0, fontSize: '16px' }}
          onClick={handlePagar}
          disabled={pagando}
        >
          {pagando ? 'Procesando pago...' : `Pagar S/ ${totalFinal.toFixed(2)}`}
        </button>
      </div>
    </>
  )
}
