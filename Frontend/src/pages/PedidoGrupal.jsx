import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function PedidoGrupal() {
  const { idMesa } = useParams()
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{"nombre":"Carlos","avatar":"🐱","isLider":true}')

  // Pedidos simulados de la mesa
  const pedidos = [
    {
      nombre: user.nombre || 'Carlos',
      avatar: user.avatar || '🐱',
      lider: user.isLider || true,
      detalle: 'Pollo 1/4 + Inca Kola',
      precio: 23.00,
      estado: 'listo'
    },
    {
      nombre: 'Ana',
      avatar: '🐶',
      lider: false,
      detalle: 'Pollo 1/2 + Inca Kola',
      precio: 37.00,
      estado: 'listo'
    },
    {
      nombre: 'Luis',
      avatar: '🦊',
      lider: false,
      detalle: null,
      precio: 0,
      estado: 'pendiente'
    }
  ]

  const totalParcial = pedidos.reduce((sum, p) => sum + p.precio, 0)
  const modoPago = user.modoPago || 'individual'

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div className="flex-col flex-1 animate-fade-in">
        <div className="wf-label" style={{ marginBottom: '12px' }}>
          Pedidos de la mesa
        </div>

        {/* Lista de pedidos por persona */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {pedidos.map((p, i) => (
            <div
              key={i}
              className={`wf-block animate-fade-in stagger-${i + 1}`}
              style={{ marginBottom: 0, padding: '12px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="user-avatar-sm" style={{ width: '32px', height: '32px', fontSize: '15px' }}>
                  {p.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{p.nombre}</span>
                    {p.lider && <span className="lider-badge">Líder</span>}
                  </div>
                  {p.detalle ? (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {p.detalle} · <span style={{ color: 'var(--color-accent)' }}>S/ {p.precio.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}
                      className="animate-pulse">
                      Aún no ha pedido...
                    </div>
                  )}
                </div>
                {p.estado === 'listo' && (
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'var(--color-success-dim)',
                    border: '1px solid var(--color-success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: 'var(--color-success)', flexShrink: 0
                  }}>✓</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Divider + Total parcial */}
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total parcial</span>
          <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            S/ {totalParcial.toFixed(2)}
          </span>
        </div>

        {/* Nota de modo pago */}
        {modoPago === 'lider' && (
          <div style={{
            fontSize: '11px', color: 'var(--color-text-tertiary)',
            textAlign: 'center', marginBottom: '14px'
          }}>
            En modo líder, {user.nombre || 'el líder'} pagará el total final
          </div>
        )}

        {/* Botones */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            id="btn-enviar-pedido"
            className="wf-btn-solid"
            onClick={() => navigate(`/mesa/${idMesa}/confirmado`)}
          >
            Enviar mi pedido →
          </button>
          <button
            className="wf-btn-outline"
            onClick={() => navigate(`/mesa/${idMesa}/menu`)}
          >
            ← Volver al menú
          </button>
        </div>
      </div>
    </>
  )
}
