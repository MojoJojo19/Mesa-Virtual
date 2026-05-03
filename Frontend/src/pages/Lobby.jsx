import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function Lobby() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  
  // Usuario actual
  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{}')

  // Simulamos a los otros compañeros conectados
  const conectados = [
    { nombre: user.nombre || 'Carlos', avatar: user.avatar || '🐱', lider: true },
    { nombre: 'Ana', avatar: '🐶', lider: false },
    { nombre: 'Luis', avatar: '🦊', lider: false }
  ]

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 className="title-main">Sala de mesa</h1>
        <p className="subtitle">Esperando a los demás comensales</p>

        <div className="wf-block">
          <span className="wf-label" style={{ textTransform: 'uppercase' }}>Conectados ahora</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {conectados.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                border: '1px solid var(--color-border-tertiary)',
                borderRadius: '20px', padding: '6px 12px',
                backgroundColor: 'var(--color-background-primary)'
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  backgroundColor: 'var(--color-border-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                }}>
                  {c.avatar}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{c.nombre}</span>
                {c.lider && (
                  <span style={{
                    marginLeft: 'auto', fontSize: '10px',
                    border: '1px solid var(--color-border-secondary)',
                    borderRadius: '6px', padding: '2px 6px',
                    backgroundColor: 'var(--color-background-secondary)'
                  }}>Líder</span>
                )}
              </div>
            ))}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              border: '1px dashed var(--color-border-tertiary)',
              borderRadius: '20px', padding: '6px 12px',
              marginTop: '5px'
            }}>
               <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>+ Esperando persona 4...</span>
            </div>
          </div>
        </div>

        <div className="wf-block">
          <span className="wf-label" style={{ textTransform: 'uppercase' }}>Código de sala</span>
          <div style={{ textAlign: 'center', fontSize: '32px', fontWeight: '600', letterSpacing: '0.2em', padding: '10px 0', color: 'var(--color-text-primary)' }}>
            7823
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-secondary)' }}>Comparte con tus compañeros</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto' }}>
          <button className="wf-btn-outline" onClick={() => navigate(`/mesa/${idMesa}/menu`)}>Pedir ya →</button>
          <button className="wf-btn-outline">Esperar todos</button>
        </div>
      </div>
    </>
  )
}
