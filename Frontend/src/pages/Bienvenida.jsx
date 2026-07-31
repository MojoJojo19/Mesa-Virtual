import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { getMesa } from '../services/api'
import TopBar from '../components/TopBar'
import Monograma from '../components/Monograma'
import { aplicarAcento } from '../theme/sala'

const PASOS = [
  { n: 1, color: 'var(--st-accent)', fg: '#fff',      texto: 'Entran con el PIN del centro de mesa' },
  { n: 2, color: 'var(--st-violet)', fg: '#fff',      texto: 'Cada uno arma su pedido' },
  { n: 3, color: 'var(--st-lime)',   fg: '#150a24',   texto: 'Mandan todo a cocina de una vez' }
]

export default function Bienvenida() {
  const { idMesa } = useParams()
  const navigate = useNavigate()

  const [nombreRestaurante, setNombreRestaurante] = useState('')
  const [comensales, setComensales] = useState([])
  const [errorMesa, setErrorMesa] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarDetallesMesa = async () => {
      try {
        const mesa = await getMesa(idMesa)
        if (mesa && mesa.id_mesa) {
          const restName = mesa.restaurante ? mesa.restaurante.nombre : (mesa.nombre_restaurante ? mesa.nombre_restaurante : 'La Fogata')
          setNombreRestaurante(restName)
          localStorage.setItem('swifttable_nombre_restaurante', restName)
          setComensales(Array.isArray(mesa.comensales) ? mesa.comensales : [])
          // El acento del local viste todas las pantallas siguientes.
          aplicarAcento(mesa.id_restaurante)
        } else {
          setErrorMesa(true)
        }
      } catch (err) {
        console.error('Error cargando mesa:', err)
        setErrorMesa(true)
      } finally {
        setCargando(false)
      }
    }
    cargarDetallesMesa()
  }, [idMesa])

  if (errorMesa) {
    return (
      <div className="st-screen">
        <div className="st-body" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 18 }}>
          <div className="st-tile" style={{ width: 84, height: 84, borderRadius: 26, background: 'var(--st-surface)', color: '#FF6B76' }}>
            <AlertTriangle size={40} strokeWidth={2.4} />
          </div>
          <h1 className="st-h2">Esta mesa no existe</h1>
          <p className="st-lead" style={{ maxWidth: 280 }}>
            El código QR no corresponde a ninguna mesa activa. Pídele ayuda al personal del local.
          </p>
          <button className="st-btn st-btn--primary" style={{ marginTop: 12 }} onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  /* Cuatro lugares en la mesa: los que ya entraron, y el resto libres. */
  const lugares = [...comensales.slice(0, 4)]
  const libres = Math.max(1, 4 - lugares.length)

  return (
    <div className="st-screen">
      <div
        className="st-glow"
        style={{ top: -90, right: -70, width: 280, height: 280, background: 'var(--st-accent)', opacity: 0.4 }}
      />

      <TopBar nombre={nombreRestaurante || undefined} meta={`Mesa ${idMesa} · Sala abierta`} />

      <div className="st-body">
        <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {lugares.map((c, i) => (
              <Monograma
                key={c.id_comensal || i}
                nombre={c.nombre}
                avatar={c.avatar}
                size={52}
                radius={16}
                className="st-float"
                style={{ animationDelay: `${i * 0.5}s` }}
              />
            ))}
            {Array.from({ length: libres }).map((_, i) => (
              <div
                key={`libre-${i}`}
                className="st-tile"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  border: '2px dashed var(--st-border-2)',
                  color: 'var(--st-text-3)',
                  fontSize: 24
                }}
              >
                +
              </div>
            ))}
          </div>

          <h1 className="st-h1" style={{ fontSize: 42, textAlign: 'center' }}>
            {comensales.length > 0 ? 'Súmate a la mesa' : '¡Su mesa ya está lista!'}
          </h1>

          <p className="st-lead" style={{ textAlign: 'center', maxWidth: 290 }}>
            Pidan juntos desde el celular, vean lo que eligió cada uno y dividan la cuenta como quieran.
          </p>
        </div>

        <div className="st-card" style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="st-label">Cómo funciona</div>
          {PASOS.map(p => (
            <div key={p.n} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                className="st-tile"
                style={{ width: 28, height: 28, borderRadius: 9, background: p.color, color: p.fg, fontSize: 14 }}
              >
                {p.n}
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 500, color: '#e9e1f5' }}>{p.texto}</div>
            </div>
          ))}
        </div>

        <div className="st-footer">
          <button
            className="st-btn st-btn--primary"
            onClick={() => navigate(`/mesa/${idMesa}/pin`)}
            disabled={cargando}
          >
            {cargando ? 'Buscando la mesa…' : 'Ingresar a la mesa'}
          </button>
          <div className="st-label" style={{ textAlign: 'center' }}>Sin descargar nada · Sin crear cuenta</div>
        </div>
      </div>
    </div>
  )
}
