import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { User, Equal, HandHeart, Check } from 'lucide-react'
import { getComensalesDeMesa } from '../services/api'
import TopBar from '../components/TopBar'

const MODOS = [
  {
    id: 'individual',
    titulo: 'Cada uno lo suyo',
    desc: 'Pagas solo lo que pediste',
    icono: User,
    color: 'var(--st-cyan)',
    reparto: () => 'lo que pida'
  },
  {
    id: 'partes_iguales',
    titulo: 'Partes iguales',
    desc: 'Pedimos de todo y dividimos la cuenta',
    icono: Equal,
    color: 'var(--st-lime)',
    reparto: (_, total) => `1/${total} de la cuenta`
  },
  {
    id: 'lider',
    titulo: 'Yo invito',
    desc: 'Pagas la cuenta completa de la mesa',
    icono: HandHeart,
    color: 'var(--st-amber)',
    reparto: (esAnfitrion) => (esAnfitrion ? 'paga todo' : 'no paga')
  }
]

export default function ModoPago() {
  const { idMesa } = useParams()
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{}')
  const [modoSeleccionado, setModoSeleccionado] = useState(null)
  const [comensales, setComensales] = useState([])

  useEffect(() => {
    let vivo = true
    getComensalesDeMesa(idMesa).then(lista => {
      if (vivo) setComensales(lista.filter(c => c.estado_sesion !== 'inactiva'))
    })
    return () => { vivo = false }
  }, [idMesa])

  const handleContinuar = () => {
    if (!modoSeleccionado) return
    localStorage.setItem('swifttable_user', JSON.stringify({
      ...user,
      modoPago: modoSeleccionado,
      isLider: true // Quien configura el pago queda como anfitrión de la mesa.
    }))
    navigate(`/mesa/${idMesa}/menu`)
  }

  const modoActivo = MODOS.find(m => m.id === modoSeleccionado)
  const personas = comensales.length || 1

  return (
    <div className="st-screen">
      <TopBar
        meta={`Mesa ${idMesa} · ${personas} ${personas === 1 ? 'persona' : 'personas'}`}
        onBack={() => navigate(-1)}
      />

      <div className="st-body" style={{ paddingTop: 22 }}>
        <h1 className="st-h1">¿Cómo pagan hoy?</h1>
        <p className="st-lead" style={{ marginTop: 6 }}>Se puede cambiar antes de cerrar la cuenta.</p>

        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MODOS.map(modo => {
            const activo = modoSeleccionado === modo.id
            const Icono = modo.icono
            return (
              <button
                key={modo.id}
                type="button"
                aria-pressed={activo}
                className={`st-option ${activo ? 'st-option--on' : ''}`}
                style={activo ? { background: modo.color } : undefined}
                onClick={() => setModoSeleccionado(modo.id)}
              >
                <span className="st-option__icon">
                  <Icono size={26} strokeWidth={2.3} color={activo ? 'var(--st-ink)' : modo.color} />
                </span>

                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                  <span className="st-option__title">{modo.titulo}</span>
                  <span className="st-option__desc">{modo.desc}</span>
                </span>

                <span className="st-radio">
                  {activo && <Check size={15} strokeWidth={3.4} color={modo.color} />}
                </span>
              </button>
            )
          })}
        </div>

        {/* Previsualización: qué le toca a cada uno con el modo elegido */}
        {modoActivo && comensales.length > 0 && (
          <div
            className="st-card st-pop"
            style={{ marginTop: 20, background: 'rgba(35,213,224,0.12)', border: 'none', gap: 8, display: 'flex', flexDirection: 'column' }}
          >
            <div className="st-label" style={{ color: '#7fd8e0' }}>Cómo quedaría</div>
            {comensales.map(c => (
              <div
                key={c.id_comensal}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, fontWeight: 600 }}
              >
                <span>{c.nombre}{c.id_comensal === user.id ? ' (tú)' : ''}</span>
                <span style={{ color: 'var(--st-text-2)' }}>
                  {modoActivo.reparto(c.id_comensal === user.id, personas)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="st-footer">
          <button className="st-btn st-btn--primary" onClick={handleContinuar} disabled={!modoSeleccionado}>
            Ir al menú
          </button>
        </div>
      </div>
    </div>
  )
}
