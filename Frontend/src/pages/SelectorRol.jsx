import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, Shield, X, ChevronRight } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getMesas } from '../services/api'
import { aplicarAcento } from '../theme/sala'

/* Accesos de demostración del panel, uno por restaurante. */
const ACCESOS_STAFF = {
  '1234': { id: 1, nombre: 'La Fogata' },
  '4321': { id: 2, nombre: 'Pizzería Italia' }
}

export default function SelectorRol() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Qué está mostrando la pantalla: la portada, el selector de mesa o el PIN del personal.
  const [vista, setVista] = useState('inicio')
  const [pinPersonal, setPinPersonal] = useState('')
  const [intentosError, setIntentosError] = useState(false)
  const [mesas, setMesas] = useState([])
  const [cargandoMesas, setCargandoMesas] = useState(false)

  useEffect(() => {
    // Limpieza única de caché antigua de desarrollo.
    if (!localStorage.getItem('swifttable_v2_clean')) {
      localStorage.clear()
      localStorage.setItem('swifttable_v2_clean', 'true')
      window.location.reload()
    }
  }, [])

  useEffect(() => {
    if (vista !== 'cliente') return
    let vivo = true
    setCargandoMesas(true)
    getMesas()
      .then(data => { if (vivo) setMesas(data || []) })
      .catch(() => { if (vivo) setMesas([]) })
      .finally(() => { if (vivo) setCargandoMesas(false) })
    return () => { vivo = false }
  }, [vista])

  const handleEntrarComoPersonal = (e) => {
    e.preventDefault()
    const acceso = ACCESOS_STAFF[pinPersonal]

    if (!acceso) {
      setIntentosError(true)
      setPinPersonal('')
      toast('PIN incorrecto. Inténtalo de nuevo.', 'error')
      setTimeout(() => setIntentosError(false), 2000)
      return
    }

    localStorage.setItem('swifttable_id_restaurante', String(acceso.id))
    localStorage.setItem('swifttable_nombre_restaurante', acceso.nombre)
    aplicarAcento(acceso.id)
    toast(`Bienvenido al panel de ${acceso.nombre}`, 'success')
    navigate('/logistica')
  }

  return (
    <div className="st-screen">
      <div
        className="st-glow"
        style={{ top: -80, right: -60, width: 260, height: 260, background: 'var(--st-accent)', opacity: 0.35 }}
      />

      <div className="st-body" style={{ paddingTop: 'calc(40px + var(--safe-top))' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="st-tile"
            style={{
              width: 66, height: 66, borderRadius: 22, margin: '0 auto 16px',
              background: 'var(--st-lime)', color: 'var(--st-ink)', fontSize: 34,
              boxShadow: '0 6px 0 var(--st-lime-deep)'
            }}
          >
            S
          </div>
          <h1 className="st-h1" style={{ fontSize: 40 }}>SwiftTable</h1>
          <p className="st-label" style={{ marginTop: 6 }}>Pedidos de mesa, sin app y sin esperas</p>
        </div>

        {vista === 'inicio' ? (
          <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <button
              className="st-card st-pop"
              onClick={() => setVista('cliente')}
              style={{
                display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left',
                cursor: 'pointer', color: 'var(--st-text-1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  className="st-tile"
                  style={{ width: 48, height: 48, borderRadius: 15, background: 'var(--st-accent)', color: '#fff' }}
                >
                  <QrCode size={24} strokeWidth={2.2} />
                </span>
                <ChevronRight size={22} color="var(--st-border-2)" />
              </div>
              <span className="st-h2" style={{ fontSize: 21 }}>¿Vienes a comer?</span>
              <span className="st-lead" style={{ fontSize: 14.5 }}>
                Normalmente entras escaneando el QR de tu mesa. Si ya estás sentado, también puedes elegirla aquí.
              </span>
            </button>

            <button
              className="st-card st-pop"
              onClick={() => setVista('staff')}
              style={{
                display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left',
                cursor: 'pointer', color: 'var(--st-text-1)', animationDelay: '0.1s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  className="st-tile"
                  style={{ width: 48, height: 48, borderRadius: 15, background: 'var(--st-violet)', color: '#fff' }}
                >
                  <Shield size={24} strokeWidth={2.2} />
                </span>
                <ChevronRight size={22} color="var(--st-border-2)" />
              </div>
              <span className="st-h2" style={{ fontSize: 21 }}>Trabajo aquí</span>
              <span className="st-lead" style={{ fontSize: 14.5 }}>
                Panel de salón, pantalla de cocina y caja registradora.
              </span>
            </button>
          </div>
        ) : vista === 'cliente' ? (
          <div className="st-card st-pop" style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="st-label" style={{ color: 'var(--st-accent)' }}>Elige tu mesa</span>
              <button
                type="button"
                className="st-back"
                style={{ width: 32, height: 32 }}
                onClick={() => setVista('inicio')}
                aria-label="Volver"
              >
                <X size={17} strokeWidth={2.4} />
              </button>
            </div>

            <h2 className="st-h2" style={{ fontSize: 22 }}>¿En qué mesa estás?</h2>
            <p className="st-lead" style={{ fontSize: 14 }}>
              Después te pedimos el PIN de 4 dígitos que está en el centro de la mesa.
            </p>

            {cargandoMesas ? (
              <div className="st-empty">Buscando mesas…</div>
            ) : mesas.length === 0 ? (
              <div className="st-empty">No hay mesas configuradas en este local.</div>
            ) : (
              <div className="st-tables">
                {mesas.map(m => {
                  const ocupada = m.estado === 'ocupada'
                  return (
                    <button
                      key={m.id_mesa}
                      className={`st-mesa ${ocupada ? 'st-mesa--ocupada' : 'st-mesa--libre'}`}
                      onClick={() => navigate(`/mesa/${m.id_mesa}`)}
                      aria-label={`Entrar a la mesa ${m.numero}`}
                    >
                      <span className="st-mesa__n">M{m.numero}</span>
                      <span
                        className="st-mesa__estado"
                        style={{ color: ocupada ? 'var(--st-cyan)' : 'var(--st-lime)' }}
                      >
                        {ocupada ? 'Con gente' : 'Libre'}
                      </span>
                      {/* El PIN solo viaja en los datos de prueba: con backend real no se expone. */}
                      {m.pin && (
                        <span className="st-label" style={{ marginTop: 3, fontSize: 9 }}>PIN {m.pin}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleEntrarComoPersonal} className="st-card st-pop" style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="st-label" style={{ color: '#c9b4ff' }}>Acceso del personal</span>
              <button
                type="button"
                className="st-back"
                style={{ width: 32, height: 32 }}
                onClick={() => { setVista('inicio'); setPinPersonal('') }}
                aria-label="Volver"
              >
                <X size={17} strokeWidth={2.4} />
              </button>
            </div>

            <h2 className="st-h2" style={{ fontSize: 22 }}>Tu PIN de empleado</h2>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pinPersonal}
              onChange={e => setPinPersonal(e.target.value.replace(/\D/g, ''))}
              autoFocus
              style={{
                width: '100%',
                padding: 16,
                letterSpacing: '14px',
                textIndent: '14px',
                textAlign: 'center',
                borderRadius: 'var(--st-r-md)',
                background: 'var(--st-bg)',
                border: `2px solid ${intentosError ? '#FF6B76' : 'var(--st-border)'}`,
                color: 'var(--st-text-1)',
                fontFamily: 'var(--st-display)',
                fontSize: 26,
                fontWeight: 800,
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
            />

            <p className="st-label" style={{ textAlign: 'center' }}>PIN de demostración: 1234 o 4321</p>

            <button type="submit" className="st-btn st-btn--primary st-btn--sm" disabled={pinPersonal.length < 4}>
              Entrar al panel
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
