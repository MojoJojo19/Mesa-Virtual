import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function Resumen() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const [modoPago, setModoPago] = useState('individual') // individual, partes_iguales, lider

  // Simulamos datos
  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{"nombre": "Carlos", "avatar": "🐱", "isLider": true}')
  
  const pedidos = [
    { nombre: user.nombre, avatar: user.avatar, lider: user.isLider, detalle: 'Pollo 1/4', precio: 18.00 },
    { nombre: 'Ana', avatar: '🐶', lider: false, detalle: 'Pollo 1/2 + Inca Kola', precio: 37.00 },
    { nombre: 'Luis', avatar: '🦊', lider: false, detalle: 'Pollo 1/4', precio: 18.00 }
  ]

  const subtotal = pedidos.reduce((sum, item) => sum + item.precio, 0)
  const servicio = subtotal * 0.10
  const totalPagado = subtotal + servicio

  return (
    <>
      <div className="top-bar">
        <span>Resumen y pago</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 className="title-main" style={{ fontSize: '18px', textAlign: 'left', marginBottom: '20px' }}>
          Pedidos de la mesa
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {pedidos.map((p, i) => (
            <div key={i} className="wf-block" style={{ marginBottom: 0, padding: '10px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'var(--color-border-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>
                    {p.nombre} {p.lider && <span style={{ fontSize: '9px', padding: '2px 5px', border: '1px solid var(--color-border-secondary)', borderRadius: '4px', marginLeft: '5px' }}>Líder</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{p.detalle} · S/ {p.precio.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--color-border-tertiary)', margin: '15px 0' }}></div>

        {user.isLider && (
          <>
            <span className="wf-label" style={{ textTransform: 'uppercase' }}>Modo de pago grupal</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <label className="wf-block" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', border: modoPago === 'individual' ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border-tertiary)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>Pago individual</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Cada uno paga lo suyo</div>
                </div>
                <input type="radio" name="pago" checked={modoPago === 'individual'} onChange={() => setModoPago('individual')} style={{ accentColor: 'var(--color-text-primary)', transform: 'scale(1.2)' }} />
              </label>

              <label className="wf-block" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', border: modoPago === 'lider' ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border-tertiary)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>Asumir como líder</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Yo pago el total de la mesa</div>
                </div>
                <input type="radio" name="pago" checked={modoPago === 'lider'} onChange={() => setModoPago('lider')} style={{ accentColor: 'var(--color-text-primary)', transform: 'scale(1.2)' }} />
              </label>
            </div>
          </>
        )}

        <div className="wf-block" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Subtotal</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>S/ {subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Servicio (10%)</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>S/ {servicio.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>{modoPago === 'lider' ? 'Total líder paga' : 'Total Grupal'}</span>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>S/ {totalPagado.toFixed(2)}</span>
          </div>
        </div>

        <button className="wf-btn-solid" style={{ marginTop: 'auto' }} onClick={() => alert('¡Lógica de pago en construcción!')}>
          Pagar ahora →
        </button>
      </div>
    </>
  )
}
