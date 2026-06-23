import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bell, FileText, CheckCircle2, Clock, ChefHat, Utensils } from 'lucide-react'
import { useToast } from '../components/Toast'
import { llamarMesero, getPedidosDeMesa, getMesa } from '../services/api'

export default function PedidoEnviado() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [minutos, setMinutos] = useState(15)
  const [tiempoEsperaGlobal, setTiempoEsperaGlobal] = useState(15)
  const [estadoAnterior, setEstadoAnterior] = useState('esperando')

  const handleLlamarMozo = async () => {
    try {
      await llamarMesero(idMesa)
      toast('Llamando al mozo. En breve se acercará a su mesa.', 'success')
    } catch (e) {
      toast('Error al solicitar asistencia', 'error')
    }
  }

  const reproducirSonidoListo = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      
      const playNote = (time, freq, duration) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, time)
        gain.gain.setValueAtTime(0.15, time)
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(time)
        osc.stop(time + duration)
      }

      const now = ctx.currentTime
      playNote(now, 523.25, 0.25) // Do5
      playNote(now + 0.15, 659.25, 0.25) // Mi5
      playNote(now + 0.3, 783.99, 0.4) // Sol5
    } catch (e) {
      console.warn("Sonido bloqueado por restricciones del navegador:", e)
    }
  }

  // Polling para verificar estado del pedido
  const verificarEstado = async () => {
    try {
      // 1. Obtener pedidos
      const peds = await getPedidosDeMesa(idMesa)
      setPedidos(peds || [])

      // Calcular el nuevo estado de tracking
      let nuevoEst = 'esperando'
      if (peds && peds.length > 0) {
        const todosServidos = peds.every(p => p.estado === 'servido')
        const algunoListo = peds.some(p => p.estado === 'listo_para_servir')
        const algunoEnPreparacion = peds.some(p => p.estado === 'pendiente' || p.estado === 'en_preparacion')
        
        if (todosServidos) {
          nuevoEst = 'servido'
        } else if (algunoListo) {
          nuevoEst = 'listo'
        } else if (algunoEnPreparacion) {
          nuevoEst = 'preparacion'
        }
      }
      
      // Reproducir sonido si pasa a listo
      if (nuevoEst === 'listo' && estadoAnterior !== 'listo') {
        reproducirSonidoListo()
        toast('¡Tu comida está lista! El mesero la traerá en breve.', 'success')
      }
      
      if (nuevoEst !== 'esperando') {
        setEstadoAnterior(nuevoEst)
      }

      // 2. Verificar si la mesa fue liberada (sesión finalizada)
      const userData = localStorage.getItem('swifttable_user')
      if (!userData) {
        navigate(`/mesa/${idMesa}`)
        return
      }

      const mesaInfo = await getMesa(idMesa)
      if (mesaInfo && mesaInfo.estado === 'libre') {
        toast('Mesa liberada por administración. Sesión finalizada.', 'info')
        localStorage.removeItem('swifttable_carrito')
        localStorage.removeItem('swifttable_user')
        navigate(`/mesa/${idMesa}`)
        return
      }

      // Calcular tiempo dinámico (Opción B)
      if (mesaInfo && mesaInfo.restaurante && mesaInfo.restaurante.tiempo_espera_global) {
        const globalTime = mesaInfo.restaurante.tiempo_espera_global
        const extraTime = mesaInfo.tiempo_espera_adicional || 0
        setTiempoEsperaGlobal(globalTime + extraTime)
        
        if (peds && peds.length > 0) {
          // Tomar el pedido más antiguo que esté en preparación
          const pedsActivos = peds.filter(p => p.estado === 'pendiente' || p.estado === 'en_preparacion')
          if (pedsActivos.length > 0) {
            const oldest = pedsActivos.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0]
            const msTranscurridos = Date.now() - new Date(oldest.fecha_hora).getTime()
            const minsTranscurridos = Math.floor(msTranscurridos / 60000)
            const baseRestante = Math.max(0, globalTime - minsTranscurridos)
            const tiempoRestante = Math.max(0, baseRestante + extraTime)
            setMinutos(tiempoRestante)
          } else {
            setMinutos(0) // Todos listos
          }
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    toast('¡Pedido enviado a cocina exitosamente!', 'success')
    verificarEstado()
    
    // Polling cada 5 segundos
    const interval = setInterval(() => {
      verificarEstado()
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [idMesa])

  const restName = localStorage.getItem('swifttable_nombre_restaurante') || 'SwiftTable'

  return (
    <>
      <div className="native-app-bar">
        <div className="left-action"></div>
        <div className="title">{restName}</div>
        <div className="right-action"></div>
      </div>

      <div className="content-wrapper flex-col" style={{ padding: '16px' }}>
        
        {/* Step Progress Tracker */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 8px 24px', padding: '0 8px', position: 'relative' }}>
          {/* Línea de progreso de fondo */}
          <div style={{
            position: 'absolute', top: '16px', left: '24px', right: '24px', height: '3px',
            background: 'var(--border)', zIndex: 1
          }}></div>
          {/* Línea de progreso activa */}
          <div style={{
            position: 'absolute', top: '16px', left: '24px', 
            width: estadoAnterior === 'servido' ? 'calc(100% - 48px)' : (estadoAnterior === 'listo' ? '50%' : '0%'),
            height: '3px', background: estadoAnterior === 'listo' ? 'var(--blue)' : 'var(--green)', zIndex: 2,
            transition: 'all 0.5s ease'
          }}></div>

          {[
            { id: 'preparacion', label: 'Cocina', icon: ChefHat },
            { id: 'listo', label: 'Listo', icon: Bell },
            { id: 'servido', label: 'Entregado', icon: Utensils }
          ].map((st, idx) => {
            const isCompleted = (estadoAnterior === 'servido') || 
                                (estadoAnterior === 'listo' && idx <= 1) || 
                                (estadoAnterior === 'preparacion' && idx === 0) ||
                                (estadoAnterior === 'esperando' && idx === 0);
            
            const activeColor = st.id === 'listo' ? 'var(--blue)' : (st.id === 'servido' ? 'var(--green)' : 'var(--accent)');
            const IconComponent = st.icon;
            
            return (
              <div key={st.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '60px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: isCompleted ? activeColor : 'var(--surface)',
                  color: isCompleted ? 'white' : 'var(--text-3)',
                  border: `2.5px solid ${isCompleted ? activeColor : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: isCompleted ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
                }}>
                  <IconComponent size={15} style={{ color: isCompleted ? 'white' : 'inherit' }} />
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: '700', marginTop: '6px',
                  color: isCompleted ? 'var(--text-1)' : 'var(--text-3)'
                }}>{st.label}</span>
              </div>
            )
          })}
        </div>

        {/* Dynamic Status Card */}
        {estadoAnterior === 'servido' ? (
          <div className="card text-center animate-pop" style={{ padding: '32px 16px', margin: '0 0 24px', border: '1.5px solid var(--green-border)', background: 'var(--green-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--surface)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <CheckCircle2 size={40} strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="title-large" style={{ fontSize: '24px', color: '#166534', marginBottom: '8px' }}>¡Buen provecho!</h1>
            <p style={{ fontSize: '14px', color: '#15803d', lineHeight: 1.4 }}>
              Todos los platos han sido servidos en tu mesa. ¡Que disfrutes tu comida!
            </p>
          </div>
        ) : estadoAnterior === 'listo' ? (
          <div className="card text-center animate-pop" style={{ padding: '32px 16px', margin: '0 0 24px', border: '2px solid var(--blue)', background: 'var(--blue-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ 
                width: '72px', height: '72px', borderRadius: '50%', background: 'var(--blue)', color: 'white', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <Bell size={40} strokeWidth={2} />
              </div>
            </div>
            <h1 className="title-large" style={{ fontSize: '24px', color: 'var(--blue)', marginBottom: '8px' }}>¡Pedido listo!</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-1)', lineHeight: 1.4, fontWeight: '500' }}>
              Tus platos ya están listos en la barra. El mesero se encuentra llevándolos a tu mesa en este momento.
            </p>
          </div>
        ) : (
          <div className="card text-center animate-fade-in" style={{ padding: '32px 16px', margin: '0 0 24px', background: 'var(--accent-bg)', border: '1.5px solid var(--accent-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ 
                width: '72px', height: '72px', borderRadius: '50%', background: 'var(--surface)', color: 'var(--accent)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)'
              }}>
                <ChefHat size={36} />
              </div>
            </div>
            <h1 className="title-large" style={{ fontSize: '24px', color: 'var(--accent-2)', marginBottom: '8px' }}>En preparación...</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-1)', lineHeight: 1.4 }}>
              La cocina está preparando tus platos con ingredientes frescos.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <div style={{ background: 'var(--surface)', padding: '10px 20px', borderRadius: 'var(--r-full)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-2)', textTransform: 'uppercase' }}>Tiempo estimado</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: minutos > 0 ? 'var(--accent)' : 'var(--orange)' }}>
                  {minutos > 0 ? `${minutos} min` : 'Por salir'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="section-label" style={{ marginTop: '16px' }}>Opciones de la mesa</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="pago-option" onClick={handleLlamarMozo} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Llamar al Mozo</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>Si necesitas ayuda o algo extra</div>
              </div>
            </div>
          </div>

          <div className="pago-option" onClick={() => navigate(`/mesa/${idMesa}/resumen`)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--purple-bg)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Ver Resumen y Pagar</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>Revisa la cuenta o pide la boleta</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto text-center" style={{ padding: '32px 0 16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-3)', fontWeight: '500' }}>
            ¡Gracias por preferir La Fogata!
          </p>
        </div>

      </div>
    </>
  )
}

