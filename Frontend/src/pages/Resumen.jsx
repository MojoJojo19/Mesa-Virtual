import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const METODOS_PAGO = [
  { id: 'yape', label: 'Yape / Plin', sub: 'Pago instantáneo por QR', icon: '📱' },
  { id: 'tarjeta', label: 'Tarjeta', sub: 'Visa, Mastercard', icon: '💳' },
  { id: 'efectivo', label: 'Efectivo en caja', sub: 'El mesero traerá el vuelto', icon: '💵' }
]

export default function Resumen() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const [modoPago, setModoPago] = useState('individual')
  const [propina, setPropina] = useState(0.05)
  const [metodoPago, setMetodoPago] = useState('yape')

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{"nombre":"Carlos","avatar":"🐱","isLider":true}')
  const isLider = user.isLider || false

  const pedidosMesa = [
    { nombre: user.nombre || 'Carlos', avatar: user.avatar || '🐱', lider: user.isLider, detalle: 'Pollo 1/4 + Inca Kola', precio: 23.00 },
    { nombre: 'Ana', avatar: '🐶', lider: false, detalle: 'Pollo 1/2 + Inca Kola', precio: 37.00 },
    { nombre: 'Luis', avatar: '🦊', lider: false, detalle: 'Pollo 1/4', precio: 18.00 }
  ]

  const subtotal = modoPago === 'lider'
    ? pedidosMesa.reduce((s, p) => s + p.precio, 0)
    : (pedidosMesa[0]?.precio || 23.00)

  const servicio = subtotal * 0.10
  const propinaMonto = subtotal * propina
  const totalFinal = subtotal + servicio + propinaMonto

  const propinasOpciones = [
    { val: 0, label: 'Sin', display: '—' },
    { val: 0.05, label: '5%', display: `S/${(subtotal * 0.05).toFixed(2)}` },
    { val: 0.10, label: '10%', display: `S/${(subtotal * 0.10).toFixed(2)}` }
  ]

  return (
    <>
      <div className="top-bar">
        <span>{isLider ? 'Pago como líder' : 'Resumen y pago'}</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div className="flex-col flex-1 animate-fade-in">

        {/* Vista Líder: desglose por persona */}
        {isLider && (
          <>
            <div className="wf-block animate-fade-in stagger-1" style={{
              background: 'var(--color-accent-dim)',
              borderColor: 'var(--color-accent)',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="user-avatar-sm" style={{ fontSize: '16px', width: '32px', height: '32px' }}>
                  {user.avatar || '🐱'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-accent)' }}>
                    {user.nombre || 'Carlos'} — Modo líder
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    Asumiendo el total de la mesa
                  </div>
                </div>
              </div>
            </div>

            <div className="wf-label" style={{ marginBottom: '8px' }}>Detalle por persona</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {pedidosMesa.map((p, i) => (
                <div key={i} className={`wf-block animate-fade-in stagger-${i + 1}`} style={{ marginBottom: 0, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="user-avatar-sm">{p.avatar}</div>
                      <span style={{ fontSize: '13px' }}>{p.nombre}</span>
                      {p.lider && <span className="lider-badge">Líder</span>}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-accent)' }}>
                      S/ {p.precio.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Vista Normal: pedidos propios */}
        {!isLider && (
          <>
            <h1 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px' }}>Pedidos de la mesa</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {pedidosMesa.map((p, i) => (
                <div key={i} className="wf-block" style={{ marginBottom: 0, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="user-avatar-sm">{p.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {p.nombre}
                        {p.lider && <span className="lider-badge">Líder</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {p.detalle} · S/ {p.precio.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modo de pago (solo Líder puede cambiar) */}
        {isLider && (
          <>
            <div className="wf-label" style={{ marginBottom: '8px' }}>Modo de pago grupal</div>
            {['individual', 'lider'].map(modo => (
              <div
                key={modo}
                id={`modo-${modo}`}
                className={`pago-option`}
                style={modoPago === modo ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-dim)' } : {}}
                onClick={() => setModoPago(modo)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    {modo === 'individual' ? 'Pago individual' : 'Asumir como líder'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {modo === 'individual' ? 'Cada uno paga lo suyo' : 'Yo pago el total de la mesa'}
                  </div>
                </div>
                <div className="pago-option-radio"
                  style={modoPago === modo ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent)' } : {}} />
              </div>
            ))}
          </>
        )}

        {/* Propina */}
        <div className="wf-label" style={{ marginTop: '6px', marginBottom: '4px' }}>Propina al mesero</div>
        <div className="propina-grid" style={{ marginBottom: '14px' }}>
          {propinasOpciones.map(op => (
            <button
              key={op.val}
              id={`propina-${op.label}`}
              className={`propina-btn ${propina === op.val ? 'selected' : ''}`}
              onClick={() => setPropina(op.val)}
            >
              <div className="propina-pct">{op.label}</div>
              <div className="propina-val">{op.display}</div>
            </button>
          ))}
        </div>

        {/* Método de pago */}
        <div className="wf-label" style={{ marginBottom: '8px' }}>Método de pago</div>
        {METODOS_PAGO.map(m => (
          <div
            key={m.id}
            id={`metodo-${m.id}`}
            className="pago-option"
            style={{
              ...(metodoPago === m.id ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-dim)' } : {}),
              marginBottom: '8px'
            }}
            onClick={() => setMetodoPago(m.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <span style={{ fontSize: '18px' }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{m.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>{m.sub}</div>
              </div>
            </div>
            <div className="pago-option-radio"
              style={metodoPago === m.id ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent)' } : {}} />
          </div>
        ))}

        {/* Resumen total */}
        <div className="total-box">
          <div className="total-row">
            <span>Subtotal</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Servicio (10%)</span>
            <span>S/ {servicio.toFixed(2)}</span>
          </div>
          {propina > 0 && (
            <div className="total-row">
              <span>Propina ({(propina * 100).toFixed(0)}%)</span>
              <span>S/ {propinaMonto.toFixed(2)}</span>
            </div>
          )}
          <div className="total-row final">
            <span>{modoPago === 'lider' ? 'Total líder paga' : 'Total a pagar'}</span>
            <span style={{ color: 'var(--color-accent)' }}>S/ {totalFinal.toFixed(2)}</span>
          </div>
        </div>

        <button
          id="btn-pagar"
          className="wf-btn-solid"
          style={{ marginTop: 'auto' }}
          onClick={() => alert('¡Pago en construcción! Total: S/ ' + totalFinal.toFixed(2))}
        >
          Pagar ahora →
        </button>
      </div>
    </>
  )
}
