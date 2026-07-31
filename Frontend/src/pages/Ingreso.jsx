import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { crearComensal, actualizarEstadoMesa } from '../services/api'
import { useToast } from '../components/Toast'
import TopBar from '../components/TopBar'
import StepBar from '../components/StepBar'
import { COLORES_COMENSAL, inicial } from '../theme/sala'

const MAX_NOMBRE = 15

export default function Ingreso() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [nombre, setNombre] = useState('')
  // El color es la identidad del comensal en la sala; se guarda como hex.
  const [color, setColor] = useState(COLORES_COMENSAL[0].hex)
  const [cargando, setCargando] = useState(false)

  const handleUnirse = async () => {
    if (!nombre.trim()) {
      toast('Escribe tu nombre para continuar', 'error')
      return
    }

    setCargando(true)
    const nuevoComensal = await crearComensal(nombre.trim(), color, idMesa)
    setCargando(false)

    if (nuevoComensal) {
      localStorage.setItem('swifttable_user', JSON.stringify({
        id: nuevoComensal.id_comensal,
        nombre: nuevoComensal.nombre,
        avatar: nuevoComensal.avatar,
        idMesa,
        isLider: true,
        modoPago: 'individual'
      }))

      // Con alguien sentado, la mesa deja de estar libre: así el panel del
      // salón la ve ocupada y el comensal no queda fuera de la sesión.
      actualizarEstadoMesa(idMesa, 'ocupada').catch(() => {})

      navigate(`/mesa/${idMesa}/lobby`)
    } else {
      toast('No pudimos sumarte a la mesa', 'error')
    }
  }

  const elegido = COLORES_COMENSAL.find(c => c.hex === color) || COLORES_COMENSAL[0]
  const letra = inicial(nombre)

  return (
    <div className="st-screen">
      <TopBar meta={`Mesa ${idMesa}`} onBack={() => navigate(-1)} />

      <div style={{ padding: '22px 22px 0' }}>
        <StepBar paso={1} />
      </div>

      <div className="st-body" style={{ paddingTop: 22 }}>
        <h1 className="st-h1">¿Quién pide?</h1>
        <p className="st-lead" style={{ marginTop: 6 }}>
          Tu nombre aparece en la sala y en el pedido de la mesa.
        </p>

        {/* Nombre + vista previa de la ficha */}
        <label
          style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'var(--st-surface)',
            border: `2px solid ${nombre.trim() ? 'var(--st-lime)' : 'var(--st-border)'}`,
            borderRadius: 20,
            padding: '14px 16px',
            transition: 'border-color 0.2s ease',
            cursor: 'text'
          }}
        >
          <div
            className="st-tile"
            style={{ width: 52, height: 52, borderRadius: 16, background: elegido.hex, color: elegido.fg, fontSize: 26 }}
            aria-hidden="true"
          >
            {letra}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
            <span className="st-label">Tu nombre</span>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value.substring(0, MAX_NOMBRE))}
              onKeyDown={e => { if (e.key === 'Enter' && nombre.trim()) handleUnirse() }}
              placeholder="Escríbelo aquí"
              autoFocus
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--st-text-1)',
                fontFamily: 'var(--st-display)',
                fontWeight: 700,
                fontSize: 24,
                padding: 0
              }}
            />
          </div>

          <span className="st-label" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {nombre.length}/{MAX_NOMBRE}
          </span>
        </label>

        <div className="st-label" style={{ marginTop: 24 }}>Elige tu color</div>

        <div className="st-colors" style={{ marginTop: 12 }} role="radiogroup" aria-label="Color del comensal">
          {COLORES_COMENSAL.map(c => (
            <button
              key={c.hex}
              type="button"
              role="radio"
              aria-checked={color === c.hex}
              aria-label={`Color ${c.hex}`}
              className={`st-color ${color === c.hex ? 'st-color--on' : ''}`}
              style={{ background: c.hex, color: c.fg }}
              onClick={() => setColor(c.hex)}
            >
              {letra}
            </button>
          ))}
        </div>

        <div className="st-footer">
          <button
            className="st-btn st-btn--primary"
            onClick={handleUnirse}
            disabled={!nombre.trim() || cargando}
          >
            {cargando ? 'Entrando…' : 'Entrar a la sala'}
          </button>
        </div>
      </div>
    </div>
  )
}
