import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bell, FileText, ChefHat, CheckCircle2, ChevronRight } from 'lucide-react'
import { useToast } from '../components/Toast'
import { llamarMesero, getPedidosDeMesa, getMesa, getComensalesDeMesa } from '../services/api'
import TopBar from '../components/TopBar'
import { nombreRestaurante } from '../theme/sala'

/* Los tres estados que ve el comensal, y cómo se pinta cada uno. */
const FASES = ['EN COCINA', 'LISTO', 'ENTREGADO']

const VISTA = {
  preparacion: {
    fase: 0,
    color: 'var(--st-amber)',
    textoOscuro: '#43330a',
    icono: ChefHat,
    titulo: 'La cocina\nestá en eso',
    detalle: 'Sus platos entraron juntos al fuego. Te avisamos en cuanto salgan.'
  },
  listo: {
    fase: 1,
    color: 'var(--st-cyan)',
    textoOscuro: '#123c40',
    icono: Bell,
    titulo: '¡Su pedido\nestá listo!',
    detalle: 'Ya salió de la cocina. El mozo lo está llevando a su mesa.'
  },
  servido: {
    fase: 2,
    color: 'var(--st-lime)',
    textoOscuro: '#2f4410',
    icono: CheckCircle2,
    titulo: '¡Buen\nprovecho!',
    detalle: 'Todos los platos están servidos. Que disfruten la comida.'
  }
}

export default function PedidoEnviado() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [estado, setEstado] = useState('preparacion')
  const [minutos, setMinutos] = useState(15)
  // Evita repetir el aviso sonoro en cada vuelta del sondeo.
  const yaAvisado = useRef(false)

  const handleLlamarMozo = async () => {
    try {
      await llamarMesero(idMesa)
      toast('Llamando al mozo. En breve se acerca a su mesa.', 'success')
    } catch (e) {
      toast('No pudimos avisar al mozo', 'error')
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
      playNote(now, 523.25, 0.25)
      playNote(now + 0.15, 659.25, 0.25)
      playNote(now + 0.3, 783.99, 0.4)
    } catch (e) {
      console.warn('Sonido bloqueado por restricciones del navegador:', e)
    }
  }

  useEffect(() => {
    let vivo = true

    const verificarEstado = async () => {
      try {
        const peds = await getPedidosDeMesa(idMesa)
        if (!vivo) return

        if (peds && peds.length > 0) {
          const todosServidos = peds.every(p => p.estado === 'servido')
          const algunoListo = peds.some(p => p.estado === 'listo_para_servir')

          let nuevo = 'preparacion'
          if (todosServidos) nuevo = 'servido'
          else if (algunoListo) nuevo = 'listo'

          if (nuevo === 'listo' && !yaAvisado.current) {
            yaAvisado.current = true
            reproducirSonidoListo()
            toast('¡Su comida está lista! El mozo la trae en breve.', 'success')
          }
          setEstado(nuevo)
        }

        // Si ya no hay sesión en este dispositivo, no hay nada que seguir.
        if (!localStorage.getItem('swifttable_user')) {
          navigate(`/mesa/${idMesa}`)
          return
        }

        /*
         * La sesión terminó solo si se cumplen las dos cosas: el panel dejó
         * la mesa en "libre" y además borró a los comensales (eso hace el
         * endpoint /liberar). Pedir ambas evita echar al comensal por una
         * lectura suelta del estado.
         */
        const [mesaInfo, enLaMesa] = await Promise.all([
          getMesa(idMesa),
          getComensalesDeMesa(idMesa)
        ])
        if (!vivo) return

        const mesaLibre = mesaInfo && mesaInfo.estado === 'libre'
        const usuario = JSON.parse(localStorage.getItem('swifttable_user') || '{}')
        const sigoEnLaMesa = enLaMesa.some(c => c.id_comensal === usuario.id)

        if (mesaLibre && !sigoEnLaMesa) {
          toast('Mesa cerrada por el restaurante. ¡Hasta la próxima!', 'info')
          localStorage.removeItem('swifttable_carrito')
          localStorage.removeItem('swifttable_user')
          navigate(`/mesa/${idMesa}`)
        }
      } catch (e) {
        console.error(e)
      }
    }

    toast('¡Pedido enviado a cocina!', 'success')
    verificarEstado()

    const sondeo = setInterval(verificarEstado, 5000)
    const reloj = setInterval(() => setMinutos(m => (m > 0 ? m - 1 : 0)), 60000)

    return () => { vivo = false; clearInterval(sondeo); clearInterval(reloj) }
  }, [idMesa, navigate, toast])

  const vista = VISTA[estado]
  const Icono = vista.icono

  return (
    <div className="st-screen">
      <div
        className="st-glow"
        style={{ top: 120, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, background: vista.color, opacity: 0.28 }}
      />

      <TopBar meta={`Mesa ${idMesa} · ${FASES[vista.fase]}`} />

      <div className="st-body" style={{ paddingTop: 22 }}>
        <div className="st-steps">
          {FASES.map((etiqueta, i) => (
            <div key={etiqueta} className={`st-step ${i < vista.fase ? 'st-step--done' : i === vista.fase ? 'st-step--active' : ''}`}>
              <div
                className="st-step__bar"
                style={i <= vista.fase ? { background: vista.color, height: 8 } : { height: 8 }}
              />
              <div className="st-step__label" style={i === vista.fase ? { color: vista.color } : undefined}>
                {etiqueta}
              </div>
            </div>
          ))}
        </div>

        <div
          className="st-pop"
          style={{
            marginTop: 26,
            background: vista.color,
            borderRadius: 26,
            padding: '26px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 7px 0 rgba(21,10,36,0.3)'
          }}
        >
          <div
            className="st-tile st-float"
            style={{ width: 88, height: 88, borderRadius: 28, background: 'var(--st-ink)', color: vista.color }}
          >
            <Icono size={44} strokeWidth={2} />
          </div>

          <h1 className="st-h1" style={{ fontSize: 34, textAlign: 'center', color: 'var(--st-ink)', whiteSpace: 'pre-line' }}>
            {vista.titulo}
          </h1>

          <p style={{ fontSize: 14.5, fontWeight: 600, color: vista.textoOscuro, textAlign: 'center', maxWidth: 250, textWrap: 'pretty' }}>
            {vista.detalle}
          </p>

          {estado === 'preparacion' && (
            <div
              style={{
                background: 'var(--st-ink)',
                borderRadius: 999,
                padding: '9px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <span className="st-label">Faltan</span>
              <span className="st-num" style={{ fontSize: 20, color: vista.color }}>{minutos} min</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="st-sheet__item" onClick={handleLlamarMozo}>
            <span
              className="st-tile"
              style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--st-accent)', color: '#fff' }}
            >
              <Bell size={20} strokeWidth={2.4} />
            </span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 18 }}>Llamar al mozo</span>
              <span style={{ fontSize: 13, color: 'var(--st-text-3)', fontWeight: 500 }}>Cubiertos, hielo, algo más</span>
            </span>
            <ChevronRight size={20} color="var(--st-border-2)" />
          </button>

          <button className="st-sheet__item" onClick={() => navigate(`/mesa/${idMesa}/resumen`)}>
            <span
              className="st-tile"
              style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--st-violet)', color: '#fff' }}
            >
              <FileText size={20} strokeWidth={2.2} />
            </span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 18 }}>Ver la cuenta</span>
              <span style={{ fontSize: 13, color: 'var(--st-text-3)', fontWeight: 500 }}>Revisa el total y paga</span>
            </span>
            <ChevronRight size={20} color="var(--st-border-2)" />
          </button>
        </div>

        {/* El nombre sale del local que se escaneó, no de uno fijo. */}
        <p style={{ marginTop: 'auto', paddingTop: 24, textAlign: 'center', fontSize: 13.5, color: 'var(--st-text-3)', fontWeight: 600 }}>
          ¡Gracias por preferir {nombreRestaurante()}!
        </p>
      </div>
    </div>
  )
}
