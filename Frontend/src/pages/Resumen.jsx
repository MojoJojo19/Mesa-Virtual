import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Smartphone, CreditCard, Banknote } from 'lucide-react'

const METODOS_PAGO = [
  { id: 'yape',     label: 'Yape / Plin', sub: 'Pago instantáneo por QR', icon: Smartphone, color: '#8b5cf6' },
  { id: 'tarjeta',  label: 'Tarjeta',     sub: 'Visa, Mastercard', icon: CreditCard, color: '#3b82f6' },
  { id: 'efectivo', label: 'Efectivo',    sub: 'El mesero traerá el vuelto', icon: Banknote, color: '#10b981' }
]

export default function Resumen() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  
  const [metodoPago, setMetodoPago] = useState('yape')
  const [propinaIdx, setPropinaIdx] = useState(1) // 0=0%, 1=5%, 2=10%

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{"nombre":"Carlos","isLider":true}')
  const isLider = user.isLider || false

  const miCarrito = JSON.parse(localStorage.getItem('swifttable_carrito') || '[]')
  const miTotal = miCarrito.reduce((s, p) => s + Number(p.precio || 0) * (p.cantidad || 1), 0)

  const pedidosMesa = [
    { nombre: user.nombre, isLider: user.isLider, precio: miTotal },
    { nombre: 'Ana',  isLider: false, precio: 37.00 },
    { nombre: 'Luis', isLider: false, precio: 23.00 },
  ]

  const subtotal = (isLider && user.modoPago === 'lider')
    ? pedidosMesa.reduce((s, p) => s + p.precio, 0)
    : miTotal

  const servicio = subtotal * 0.10
  const pctPropina = propinaIdx === 0 ? 0 : propinaIdx === 1 ? 0.05 : 0.10
  const propinaMonto = subtotal * pctPropina
  const totalFinal = subtotal + servicio + propinaMonto

  return (
    <>
      <div className="native-app-bar">
        <div className="left-action">
          <button className="wf-btn-ghost" onClick={() => navigate(-1)} style={{ padding: 0 }}>
            <ChevronLeft size={28} color="var(--accent)" />
          </button>
        </div>
        <div className="title">Pago</div>
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
              <span style={{ color: 'var(--text-2)' }}>Propina ({(pctPropina*100).toFixed(0)}%)</span>
              <span>S/ {propinaMonto.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="section-label">Propina sugerida</div>
        <div className="segmented-control">
          {[0, 0.05, 0.10].map((val, idx) => (
            <div 
              key={idx}
              className={`segment-btn ${propinaIdx === idx ? 'active' : ''}`}
              onClick={() => setPropinaIdx(idx)}
            >
              {val === 0 ? 'Nada' : `${val*100}%`}
            </div>
          ))}
        </div>

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

      <div className="native-bottom-bar">
        <button 
          className="wf-btn-solid" 
          onClick={() => alert(`Pagando S/ ${totalFinal.toFixed(2)}`)}
        >
          Pagar S/ {totalFinal.toFixed(2)}
        </button>
      </div>
    </>
  )
}
