import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, Shield, X, ChevronRight } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getMesas, loginStaff } from '../services/api'
import { aplicarAcento } from '../theme/sala'

export default function SelectorRol() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Qué está mostrando la pantalla: la portada, el selector de mesa o el acceso del personal.
  const [vista, setVista] = useState('inicio')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [entrando, setEntrando] = useState(false)
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

  const handleEntrarComoPersonal = async (e) => {
    e.preventDefault()
    if (entrando) return
    setEntrando(true)

    try {
      // El restaurante ya no se deduce de un PIN cableado: lo dice el token.
      const sesion = await loginStaff(correo.trim(), contrasena)
      aplicarAcento(sesion.id_restaurante)
      toast(`Bienvenido al panel de ${sesion.nombre_restaurante}`, 'success')
      navigate('/logistica')
    } catch (err) {
      setIntentosError(true)
      setContrasena('')
      toast(err.message, 'error')
      setTimeout(() => setIntentosError(false), 2000)
    } finally {
      setEntrando(false)
    }
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
                onClick={() => { setVista('inicio'); setCorreo(''); setContrasena('') }}
                aria-label="Volver"
              >
                <X size={17} strokeWidth={2.4} />
              </button>
            </div>

            <h2 className="st-h2" style={{ fontSize: 22 }}>Inicia sesión</h2>

            <input
              type="email"
              placeholder="tu@restaurante.com"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              autoFocus
              autoComplete="username"
              required
              className="st-input"
              style={{ borderColor: intentosError ? '#FF6B76' : 'var(--st-border)' }}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
              autoComplete="current-password"
              required
              className="st-input"
              style={{ borderColor: intentosError ? '#FF6B76' : 'var(--st-border)' }}
            />

            {/* Sin respaldo local a propósito: un mock aquí sería otra vez un
                acceso cableado. Si el backend está apagado, no se entra. */}
            <p className="st-label" style={{ textAlign: 'center' }}>
              Necesitas el backend encendido para entrar al panel.
            </p>

            <button
              type="submit"
              className="st-btn st-btn--primary st-btn--sm"
              disabled={entrando || !correo.trim() || !contrasena}
            >
              {entrando ? 'Entrando…' : 'Entrar al panel'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
