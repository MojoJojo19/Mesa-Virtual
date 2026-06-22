import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users, Copy, Share } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getComensalesDeMesa, getMesa } from '../services/api'

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
  const [pinMesa, setPinMesa] = useState('----')
  const [numeroMesa, setNumeroMesa] = useState(localStorage.getItem('swifttable_numero_mesa') || idMesa)

  useEffect(() => {
    const timer = setTimeout(() => {
      setConectados(prev => {
        if (prev.length <= 2 && prev.some(c => c.nombre === 'Ana')) {
          toast('Luis se unió a la mesa', 'info')
          return [...prev, { nombre: 'Luis', avatar: '🦊', isLider: false }]
        }
        return prev
      })
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const verificarEstadoYComensales = async () => {
      try {
        const mesaInfo = await getMesa(idMesa)
        if (mesaInfo) {
          if (mesaInfo.estado === 'libre') {
            toast('Mesa liberada por administración. Sesión finalizada.', 'info')
            localStorage.removeItem('swifttable_carrito')
            localStorage.removeItem('swifttable_user')
            navigate(`/mesa/${idMesa}`)
            return
          }
          setPinMesa(mesaInfo.pin || '----')
          setNumeroMesa(mesaInfo.numero || idMesa)
        }

        const dbComensales = await getComensalesDeMesa(idMesa)
        if (dbComensales && dbComensales.length > 0) {
          const list = dbComensales.map((c, i) => ({
            nombre: c.nombre,
            avatar: c.avatar || '🐱',
            isLider: i === 0
          }))
          setConectados(list)
        }
      } catch (err) {
        console.error(err)
      }
    }

    verificarEstadoYComensales()
    const interval = setInterval(verificarEstadoYComensales, 4000)
    return () => clearInterval(interval)
  }, [idMesa, navigate, toast])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`swifttable.com/mesa/${idMesa}`)
    toast('Enlace copiado al portapapeles', 'success')
  }

  const restName = localStorage.getItem('swifttable_nombre_restaurante') || 'SwiftTable'

  return (
    <>
      <div className="native-app-bar">
        <div className="left-action"></div>
        <div className="title">{restName} - Mesa {numeroMesa}</div>
        <div className="right-action">
          <button className="wf-btn-ghost" onClick={handleCopyLink} style={{ padding: 0 }}>
            <Share size={24} color="var(--accent)" />
          </button>
        </div>
      </div>

      <div className="content-wrapper">
        
        <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
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
            onClick={() => navigate(`/mesa/${idMesa}/menu`)}
          >
            Empezar a Pedir
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
