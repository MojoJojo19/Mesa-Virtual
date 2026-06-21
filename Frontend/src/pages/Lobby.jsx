import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users, Copy, Share } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function Lobby() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{"nombre":"Carlos","avatar":"🐱","isLider":true}')
  const isLider = user.isLider || false

  const [conectados, setConectados] = useState([
    { nombre: user.nombre || 'Carlos', avatar: user.avatar || '🐱', isLider },
    { nombre: 'Ana', avatar: '🐶', isLider: false }
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      setConectados(prev => [...prev, { nombre: 'Luis', avatar: '🦊', isLider: false }])
      toast('Luis se unió a la mesa', 'info')
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`swifttable.com/mesa/${idMesa}`)
    toast('Enlace copiado al portapapeles', 'success')
  }

  return (
    <>
      <div className="native-app-bar">
        <div className="left-action"></div>
        <div className="title">Sala de Espera</div>
        <div className="right-action">
          <button className="wf-btn-ghost" onClick={handleCopyLink} style={{ padding: 0 }}>
            <Share size={24} color="var(--accent)" />
          </button>
        </div>
      </div>

      <div className="content-wrapper">
        
        <div style={{ textAlign: 'center', margin: '24px 0 32px' }}>
          <div className="section-label">Código de la Mesa</div>
          <div style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-1)' }}>
            7823
          </div>
        </div>

        <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} /> {conectados.length} Personas conectadas
        </div>

        <div className="card" style={{ padding: '0' }}>
          {conectados.map((c, i) => (
            <div key={i} className={`list-item animate-pop stagger-${i + 1}`} style={{ padding: '16px' }}>
              <div className="avatar-circle" style={{ animation: 'wiggle 2s ease-in-out infinite', animationDelay: `${i * 0.5}s` }}>
                {c.avatar}
              </div>
              <div style={{ flex: 1, fontSize: '17px', fontWeight: '600' }}>{c.nombre}</div>
              {c.isLider && <div style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: '500' }}>Líder</div>}
            </div>
          ))}
          <div className={`list-item animate-fade-in stagger-${conectados.length + 1}`} style={{ padding: '16px', opacity: 0.5 }}>
            <div className="avatar-circle" style={{ background: 'var(--bg)' }}></div>
            <div style={{ flex: 1, fontSize: '17px', fontStyle: 'italic' }}>Esperando a otros...</div>
          </div>
        </div>

        {isLider && (
          <p style={{ fontSize: '14px', color: 'var(--text-2)', textAlign: 'center', margin: '24px 16px' }}>
            Eres el líder. Decide cuándo empezar el pedido por todos.
          </p>
        )}
      </div>

      <div className="native-bottom-bar">
        {isLider ? (
          <button 
            className="wf-btn-solid" 
            onClick={() => navigate(`/mesa/${idMesa}/pago-modo`)}
          >
            Configurar pago e Iniciar
          </button>
        ) : (
          <button 
            className="wf-btn-outline" 
            onClick={() => navigate(`/mesa/${idMesa}/menu`)}
          >
            Ver menú mientras esperamos
          </button>
        )}
      </div>
    </>
  )
}
