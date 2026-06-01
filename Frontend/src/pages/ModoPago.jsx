import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const MODOS = [
  {
    id: 'individual',
    titulo: 'Pago individual',
    sub: 'Cada uno paga lo suyo',
    icon: '👤'
  },
  {
    id: 'partes_iguales',
    titulo: 'Dividir en partes iguales',
    sub: 'Total entre todos',
    icon: '➗'
  },
  {
    id: 'lider',
    titulo: 'Asumir como líder',
    sub: 'Yo pago el total de la mesa',
    icon: '👑'
  }
]

export default function ModoPago() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const [modoSeleccionado, setModoSeleccionado] = useState('individual')

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{}')

  const handleConfirmar = () => {
    // Guardar el modo elegido
    const userData = JSON.parse(localStorage.getItem('swifttable_user') || '{}')
    localStorage.setItem('swifttable_user', JSON.stringify({
      ...userData,
      modoPago: modoSeleccionado,
      isLider: modoSeleccionado === 'lider'
    }))
    navigate(`/mesa/${idMesa}/menu`)
  }

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div className="flex-col flex-1 animate-fade-in">
        <h1 className="title-main" style={{ fontSize: '20px', marginBottom: '4px' }}>
          Modo de pago grupal
        </h1>
        <p className="subtitle">¿Cómo pagará la mesa?</p>

        {/* Opciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {MODOS.map((modo, idx) => (
            <div
              key={modo.id}
              id={`modo-${modo.id}`}
              className={`pago-option animate-fade-in stagger-${idx + 1}`}
              style={modoSeleccionado === modo.id ? {
                borderColor: 'var(--color-accent)',
                background: 'var(--color-accent-dim)'
              } : {}}
              onClick={() => setModoSeleccionado(modo.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <span style={{ fontSize: '20px' }}>{modo.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    {modo.titulo}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {modo.sub}
                  </div>
                </div>
              </div>
              <div className={`pago-option-radio ${modoSeleccionado === modo.id ? 'selected' : ''}`}
                style={modoSeleccionado === modo.id ? {
                  borderColor: 'var(--color-accent)',
                  background: 'var(--color-accent)'
                } : {}}
              />
            </div>
          ))}
        </div>

        {/* Nota informativa */}
        {modoSeleccionado === 'lider' && (
          <div className="wf-block animate-fade-in" style={{
            textAlign: 'center',
            borderColor: 'var(--color-accent)',
            background: 'var(--color-accent-dim)',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              Los demás verán esta notificación:
            </div>
            <div style={{
              padding: '8px 12px', borderRadius: '8px',
              background: 'var(--color-background-secondary)',
              fontSize: '12px', color: 'var(--color-text-secondary)'
            }}>
              {user.avatar || '🐱'} <strong>{user.nombre || 'Tú'}</strong> asumirá el pago total
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <button
            id="btn-confirmar-modo"
            className="wf-btn-solid"
            onClick={handleConfirmar}
          >
            Confirmar modo →
          </button>
        </div>
      </div>
    </>
  )
}
