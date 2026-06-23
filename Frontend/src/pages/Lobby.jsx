import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users, Copy, Share, QrCode } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getComensalesDeMesa, getMesa, actualizarConfigMesa, API_URL } from '../services/api'

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
  const [tokenSesion, setTokenSesion] = useState('')
  const [tipoPago, setTipoPago] = useState('no_decidido')

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
          setTokenSesion(mesaInfo.token_sesion || '')
          if (mesaInfo.tipo_pago) {
            setTipoPago(prev => {
              // Si soy el líder y ya elegí, no dejo que el polling viejo lo sobreescriba (evita parpadeos)
              if (isLider && prev !== 'no_decidido') return prev;
              return mesaInfo.tipo_pago;
            })
          }
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
    const url = tokenSesion 
      ? `${window.location.origin}/mesa/${idMesa}?token=${tokenSesion}` 
      : `${window.location.origin}/mesa/${idMesa}`;
    navigator.clipboard.writeText(url)
    toast('Enlace de invitación copiado', 'success')
  }

  const handleTipoPagoChange = async (tipo) => {
    setTipoPago(tipo)
    try {
      await actualizarConfigMesa(idMesa, tipo)
    } catch (e) {
      console.error(e)
    }
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

        {isLider ? (
          <div className="card" style={{ marginTop: '24px', padding: '20px', textAlign: 'center', border: tipoPago === 'no_decidido' ? '2px dashed var(--accent)' : '1px solid var(--border)' }}>
            <p style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>Eres el líder de la mesa 👑</p>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>¿Cómo desean dividir la cuenta al finalizar?</p>
            
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button 
                className={tipoPago === 'junto' ? 'wf-btn-solid' : 'wf-btn-outline'}
                onClick={() => handleTipoPagoChange('junto')}
              >
                Pagar todo junto
              </button>
              <button 
                className={tipoPago === 'separado' ? 'wf-btn-solid' : 'wf-btn-outline'}
                onClick={() => handleTipoPagoChange('separado')}
              >
                Cuentas separadas
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '24px', padding: '16px', background: 'var(--bg-card)', borderRadius: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              {tipoPago === 'no_decidido' ? 'Esperando que el líder elija cómo pagar...' : 
               tipoPago === 'junto' ? '💸 El líder ha elegido: Pagar todo junto.' : 
               '💳 El líder ha elegido: Cuentas separadas.'}
            </p>
          </div>
        )}

        {/* Código QR de Invitación en la Mesa (Para que otros comensales se unan escaneando la pantalla de la tableta) */}
        <div 
          className="card animate-pop" 
          style={{ 
            padding: '20px', 
            borderRadius: '20px',
            border: '2px dashed var(--accent-border)',
            background: 'var(--accent-bg)',
            textAlign: 'center',
            marginTop: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <p style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <QrCode size={16} /> ¿Pedir desde tu propio celular?
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '16px', lineHeight: 1.4 }}>
            Escanea este código desde tu celular para unirte a esta mesa y realizar pedidos en simultáneo.
          </p>
          
          <div style={{
            background: '#fff',
            padding: '12px',
            borderRadius: '16px',
            display: 'inline-block',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)'
          }}>
            {tokenSesion ? (
              <img 
                src={`${API_URL}/mesas/${idMesa}/qr_imagen?host=${window.location.origin}`}
                alt={`Invitación Mesa ${numeroMesa}`}
                style={{ width: '130px', height: '130px', display: 'block', borderRadius: '8px' }}
                key={tokenSesion}
              />
            ) : (
              <div style={{ width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                Cargando QR...
              </div>
            )}
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-2)' }}>
            MESA: {numeroMesa} • PIN: {pinMesa}
          </div>
        </div>
      </div>

      <div className="native-bottom-bar">
        {isLider ? (
          <button 
            className="wf-btn-solid" 
            onClick={() => navigate(`/mesa/${idMesa}/menu`)}
            disabled={tipoPago === 'no_decidido'}
            style={{ opacity: tipoPago === 'no_decidido' ? 0.5 : 1 }}
          >
            {tipoPago === 'no_decidido' ? 'Elige el tipo de pago' : 'Empezar a Pedir'}
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
