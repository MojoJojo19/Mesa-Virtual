import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../components/Toast'

export default function Lobby() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [copiado, setCopiado] = useState(false)

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{}')

  const conectados = [
    { nombre: user.nombre || 'Carlos', avatar: user.avatar || '🐱', lider: true },
    { nombre: 'Ana', avatar: '🐶', lider: false },
    { nombre: 'Luis', avatar: '🦊', lider: false }
  ]

  const codigoSala = '7823'

  const handleCopiar = () => {
    navigator.clipboard.writeText(codigoSala).catch(() => {})
    setCopiado(true)
    toast(`Código ${codigoSala} copiado al portapapeles`, 'success', 2500)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div className="flex-col flex-1 animate-fade-in">
        <h1 className="title-main">Sala de mesa</h1>
        <p className="subtitle">Esperando a los demás comensales</p>

        {/* Comensales conectados */}
        <div className="wf-block">
          <span className="wf-label">Conectados ahora</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            {conectados.map((c, i) => (
              <div key={i} className={`user-pill animate-fade-in stagger-${i + 1}`}>
                <div className="user-avatar-sm">{c.avatar}</div>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>{c.nombre}</span>
                {c.lider && <span className="lider-badge">Líder</span>}
              </div>
            ))}
            <div className="user-pill waiting" style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
              <span>+ Esperando persona 4...</span>
            </div>
          </div>
        </div>

        {/* Código de sala */}
        <div className="wf-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="wf-label" style={{ marginBottom: 0 }}>Código de sala</span>
            <button
              id="btn-copiar-codigo"
              className="wf-btn-ghost"
              onClick={handleCopiar}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              {copiado ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <div
            className="sala-code"
            style={{ color: copiado ? 'var(--color-accent)' : 'var(--color-text-primary)', transition: 'color 0.3s' }}
          >
            {codigoSala}
          </div>
          <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Comparte con tus compañeros
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid-2" style={{ marginTop: 'auto', paddingTop: '10px' }}>
          <button
            id="btn-pedir-ya"
            className="wf-btn-solid"
            onClick={() => navigate(`/mesa/${idMesa}/pago-modo`)}
          >
            Pedir ya →
          </button>
          <button
            id="btn-esperar-todos"
            className="wf-btn-outline"
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
            title="Esperando que todos se conecten"
          >
            Esperar todos
          </button>
        </div>
      </div>
    </>
  )
}
