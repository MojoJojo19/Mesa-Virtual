import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getComensalesDeMesa, getPedidosDeMesa, enviarPedido } from '../services/api'
import { useToast } from '../components/Toast'
import TopBar from '../components/TopBar'
import { colorComensal, inicial } from '../theme/sala'

export default function PedidoGrupal() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{}')
  const isLider = user.isLider || false
  const miCarrito = JSON.parse(localStorage.getItem('swifttable_carrito') || '[]')

  const [comensales, setComensales] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let vivo = true

    const sincronizar = async () => {
      const [lista, peds] = await Promise.all([
        getComensalesDeMesa(idMesa),
        getPedidosDeMesa(idMesa)
      ])
      if (!vivo) return
      setComensales(lista.filter(c => c.estado_sesion !== 'inactiva'))
      setPedidos(peds || [])
      setCargando(false)
    }

    sincronizar()
    const intervalo = setInterval(sincronizar, 5000)
    return () => { vivo = false; clearInterval(intervalo) }
  }, [idMesa])

  /*
   * Lo de cada comensal = lo que ya mandó a cocina + (si soy yo) lo que
   * tengo en el carrito de este dispositivo, que todavía no se envió.
   */
  const filas = comensales.map(c => {
    const enviados = pedidos
      .filter(p => p.id_comensal === c.id_comensal)
      .flatMap(p => p.items || [])

    const soyYo = c.id_comensal === user.id
    const items = soyYo ? [...enviados, ...miCarrito] : enviados
    const total = items.reduce((s, i) => s + Number(i.precio || 0) * (i.cantidad || 1), 0)

    return { ...c, soyYo, items, total }
  })

  const handleMandarACocina = async () => {
    if (miCarrito.length === 0 || enviando) return
    setEnviando(true)
    try {
      const pedido = await enviarPedido(idMesa, miCarrito, user.id)

      if (pedido && pedido.itemsFallidos > 0) {
        toast(`${pedido.itemsFallidos} plato(s) no se pudieron registrar. Avisa al mozo.`, 'warning')
      }

      // Ya está en cocina: el carrito local deja de tener sentido.
      localStorage.removeItem('swifttable_carrito')
      navigate(`/mesa/${idMesa}/confirmado`)
    } catch (e) {
      toast('No pudimos mandar el pedido a cocina', 'error')
      setEnviando(false)
    }
  }

  const totalMesa = filas.reduce((s, f) => s + f.total, 0)
  const totalPlatos = filas.reduce((s, f) => s + f.items.reduce((n, i) => n + (i.cantidad || 1), 0), 0)
  const faltan = filas.filter(f => f.items.length === 0).length
  const puedeEnviar = miCarrito.length > 0

  return (
    <div className="st-screen">
      <TopBar meta={`Mesa ${idMesa} · Pedido de la mesa`} onBack={() => navigate(-1)} />

      <div className="st-body" style={{ paddingTop: 20 }}>
        <div
          style={{
            background: 'var(--st-accent)',
            borderRadius: 24,
            padding: 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 14
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="st-label" style={{ color: 'rgba(21,10,36,0.55)' }}>Total de la mesa</span>
            <span className="st-num" style={{ fontSize: 38, color: '#2b0d12' }}>S/ {totalMesa.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <span className="st-chip" style={{ background: 'rgba(21,10,36,0.15)', color: '#2b0d12' }}>
              {filas.length} {filas.length === 1 ? 'PERSONA' : 'PERSONAS'}
            </span>
            <span className="st-chip" style={{ background: 'rgba(21,10,36,0.15)', color: '#2b0d12' }}>
              {totalPlatos} {totalPlatos === 1 ? 'PLATO' : 'PLATOS'}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 className="st-h2">Quién pidió qué</h2>
          {faltan > 0 && (
            <span className="st-chip" style={{ background: 'rgba(255,192,46,0.16)', color: 'var(--st-amber)' }}>
              <span className="st-dot" style={{ background: 'var(--st-amber)' }} />
              FALTA{faltan > 1 ? 'N' : ''} {faltan}
            </span>
          )}
        </div>

        {cargando ? (
          <div className="st-empty">Reuniendo los pedidos…</div>
        ) : (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {filas.map(f => {
              const color = colorComensal(f.avatar, f.nombre)
              return (
                <div key={f.id_comensal} className="st-order" style={{ borderLeftColor: color.hex }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div
                      className="st-tile"
                      style={{ width: 38, height: 38, borderRadius: 12, background: color.hex, color: color.fg, fontSize: 19 }}
                    >
                      {inicial(f.nombre)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 19 }}>
                        {f.nombre}
                        {f.soyYo && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--st-text-3)' }}> (tú)</span>}
                      </div>
                      {f.items.length === 0 && (
                        <div style={{ fontSize: 13, color: 'var(--st-text-3)', fontWeight: 500 }}>Sigue eligiendo…</div>
                      )}
                    </div>

                    {f.items.length > 0 ? (
                      <div className="st-num" style={{ fontSize: 19, color: 'var(--st-lime)' }}>
                        S/ {f.total.toFixed(2)}
                      </div>
                    ) : (
                      <div className="st-typing" aria-hidden="true"><span /><span /><span /></div>
                    )}
                  </div>

                  {f.items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 49 }}>
                      {f.items.map((i, k) => (
                        <div key={k} className="st-order__line">
                          <span>{i.cantidad || 1}× {i.nombre}</span>
                          <span>S/ {(Number(i.precio || 0) * (i.cantidad || 1)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="st-footer">
          {isLider ? (
            <>
              <button
                className="st-btn st-btn--primary"
                onClick={handleMandarACocina}
                disabled={!puedeEnviar || enviando}
              >
                {enviando ? 'Mandando…' : puedeEnviar ? 'Mandar todo a cocina' : 'Aún no eliges nada'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--st-text-3)', fontWeight: 500 }}>
                Como anfitrión, tú mandas el pedido cuando estén listos.
              </p>
            </>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--st-text-2)', fontWeight: 500, padding: 16 }}>
              Esperando a que el anfitrión mande el pedido a cocina.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
