import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function AccesoConfirmado() {
  const { idMesa } = useParams()
  const navigate = useNavigate()

  const hora = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit', hour12: true
  })

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div className="flex-col flex-1 animate-fade-in">
        {/* Confirmación */}
        <div className="wf-block animate-scale-in" style={{
          textAlign: 'center',
          borderColor: 'var(--color-success)',
          background: 'var(--color-success-dim)',
          marginBottom: '16px'
        }}>
          <div className="check-circle" style={{ margin: '0 auto 14px' }}>✓</div>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
            ¡Mesa verificada!
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
            Acceso concedido correctamente
          </div>
          <div className="divider" />
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            La Fogata Grill · Mesa {idMesa} · Hasta 4 personas
          </div>
        </div>

        {/* Sesión de mesa */}
        <div className="wf-block animate-fade-in stagger-1" style={{ marginBottom: '16px' }}>
          <div className="wf-label">Sesión de mesa</div>
          <div className="status-row">
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Ingreso</span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '500' }}>{hora}</span>
          </div>
          <div className="status-row">
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Estado</span>
            <span style={{
              fontSize: '12px', fontWeight: '600',
              color: 'var(--color-success)',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <span className="animate-pulse" style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'var(--color-success)', display: 'inline-block'
              }} />
              Activa
            </span>
          </div>
          <div className="status-row">
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Pedidos</span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Ninguno aún</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button
            id="btn-ver-menu"
            className="wf-btn-solid"
            onClick={() => navigate(`/mesa/${idMesa}/ingreso`)}
          >
            Ver el menú →
          </button>
        </div>
      </div>
    </>
  )
}
