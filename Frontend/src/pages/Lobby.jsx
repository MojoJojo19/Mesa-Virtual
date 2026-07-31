import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Share2, Info, LogOut } from 'lucide-react'
import { getComensalesDeMesa, cerrarSesionComensal } from '../services/api'
import { useToast } from '../components/Toast'
import TopBar from '../components/TopBar'
import StepBar from '../components/StepBar'
import { colorComensal, inicial, esAnfitrion } from '../theme/sala'

export default function Lobby() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{}')

  // Se recalcula con cada sondeo: si el anfitrión se va, el siguiente en
  // llegar hereda el papel sin que haya que volver a entrar.
  const [isLider, setIsLider] = useState(user.isLider || false)
  const [conectados, setConectados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [confirmandoSalida, setConfirmandoSalida] = useState(false)
  // Para avisar solo de los que van llegando, no de los que ya estaban.
  const conocidos = useRef(null)

  useEffect(() => {
    let vivo = true

    const sincronizar = async () => {
      const lista = await getComensalesDeMesa(idMesa)
      if (!vivo) return

      const activos = lista.filter(c => c.estado_sesion !== 'inactiva')

      if (conocidos.current === null) {
        conocidos.current = new Set(activos.map(c => c.id_comensal))
      } else {
        activos.forEach(c => {
          if (!conocidos.current.has(c.id_comensal)) {
            conocidos.current.add(c.id_comensal)
            if (c.id_comensal !== user.id) toast(`${c.nombre} se unió a la mesa`, 'info')
          }
        })
      }

      setConectados(activos)
      setCargando(false)

      // PedidoGrupal y Resumen leen `isLider` de localStorage, así que hay que
      // dejarlo al día ahí también, no solo en el estado de esta pantalla.
      const anfitrion = esAnfitrion(activos, user.id)
      setIsLider(anfitrion)
      try {
        const guardado = JSON.parse(localStorage.getItem('swifttable_user') || '{}')
        if (guardado.isLider !== anfitrion) {
          localStorage.setItem('swifttable_user', JSON.stringify({ ...guardado, isLider: anfitrion }))
        }
      } catch { /* localStorage ilegible */ }
    }

    sincronizar()
    const intervalo = setInterval(sincronizar, 4000)
    return () => { vivo = false; clearInterval(intervalo) }
  }, [idMesa, toast, user.id])

  const handleCompartir = async () => {
    const url = `${window.location.origin}/mesa/${idMesa}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Únete a la mesa', url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast('Enlace copiado al portapapeles', 'success')
    } catch {
      // El usuario canceló el diálogo de compartir: no hay nada que informar.
    }
  }

  const handleSalirDeLaMesa = async () => {
    await cerrarSesionComensal(user.id)
    toast('Saliste de la mesa', 'info')
    navigate('/')
  }

  return (
    <div className="st-screen">
      <div
        className="st-glow"
        style={{ top: -70, left: -60, width: 260, height: 260, background: 'var(--st-violet)', opacity: 0.55 }}
      />

      <TopBar
        meta={`Mesa ${idMesa} · En vivo`}
        derecha={
          <button className="st-back" onClick={handleCompartir} aria-label="Compartir la mesa">
            <Share2 size={19} strokeWidth={2.2} color="var(--st-lime)" />
          </button>
        }
      />

      <div style={{ padding: '20px 22px 0' }}>
        <StepBar paso={2} />
      </div>

      <div className="st-body" style={{ paddingTop: 20 }}>
        <div className="st-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span className="st-label">Están en</span>
            <span className="st-num" style={{ fontSize: 38 }}>Mesa {idMesa}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <span className="st-chip" style={{ background: 'rgba(184,241,78,0.14)', color: 'var(--st-lime)' }}>
              <span className="st-dot" style={{ background: 'var(--st-lime)' }} />
              {conectados.length} {conectados.length === 1 ? 'CONECTADO' : 'CONECTADOS'}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--st-text-3)', fontWeight: 500 }}>Comparte para que entren</span>
          </div>
        </div>

        <h2 className="st-h2" style={{ marginTop: 22 }}>En la mesa</h2>

        {cargando ? (
          <div className="st-empty">Buscando a los demás…</div>
        ) : (
          <div className="st-diners" style={{ marginTop: 14 }}>
            {conectados.map((c, i) => {
              const color = colorComensal(c.avatar, c.nombre)
              const soyYo = c.id_comensal === user.id
              return (
                <div
                  key={c.id_comensal || i}
                  className="st-diner st-pop"
                  style={{ background: color.hex, color: color.fg, animationDelay: `${i * 0.12}s` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div
                      className="st-tile"
                      style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(21,10,36,0.14)', color: color.fg, fontSize: 22 }}
                    >
                      {inicial(c.nombre)}
                    </div>
                    {soyYo && isLider && (
                      <span
                        className="st-chip"
                        style={{ background: 'var(--st-ink)', color: color.hex, fontSize: 9, padding: '4px 8px' }}
                      >
                        ANFITRIÓN
                      </span>
                    )}
                  </div>
                  <div className="st-diner__name">
                    {c.nombre}
                    {soyYo && <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.6 }}> (tú)</span>}
                  </div>
                </div>
              )
            })}

            {/* Un lugar libre siempre visible: la mesa sigue abierta. */}
            <div className="st-diner st-diner--empty">
              <div
                className="st-tile"
                style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--st-surface)', color: 'var(--st-text-3)', fontSize: 24 }}
              >
                +
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Esperando…</div>
            </div>
          </div>
        )}

        {isLider && (
          <div
            className="st-note"
            style={{ marginTop: 18, background: 'rgba(122,61,245,0.22)', border: '2px solid var(--st-violet)', color: '#e2d7fb' }}
          >
            <Info size={20} strokeWidth={2.2} color="#c9b4ff" style={{ flexShrink: 0 }} />
            <span>Eres el anfitrión: tú eliges cómo se paga y cuándo se manda todo a cocina.</span>
          </div>
        )}

        <div className="st-footer">
          {isLider ? (
            <button className="st-btn st-btn--primary" onClick={() => navigate(`/mesa/${idMesa}/pago-modo`)}>
              Empezar el pedido
            </button>
          ) : (
            <button className="st-btn st-btn--primary" onClick={() => navigate(`/mesa/${idMesa}/menu`)}>
              Ver el menú
            </button>
          )}
          <button className="st-btn st-btn--outline" onClick={handleCompartir}>
            Compartir la sala
          </button>

          {/* Hasta ahora un comensal no podía salir solo: había que esperar a
              que el personal liberara la mesa. */}
          {confirmandoSalida ? (
            <div className="st-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>
                ¿Seguro que quieres salir? Se vaciará tu carrito.
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="st-btn st-btn--outline st-btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmandoSalida(false)}
                >
                  Quedarme
                </button>
                <button
                  className="st-btn st-btn--primary st-btn--sm"
                  style={{ flex: 1 }}
                  onClick={handleSalirDeLaMesa}
                >
                  Sí, salir
                </button>
              </div>
            </div>
          ) : (
            <button
              className="st-btn st-btn--outline"
              onClick={() => setConfirmandoSalida(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <LogOut size={18} strokeWidth={2.2} />
              Salir de la mesa
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
