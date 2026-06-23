import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Shield, Delete, X, AlertCircle } from 'lucide-react'
import { useToast } from '../components/Toast'
import { buscarMesaPorPin } from '../services/api'

export default function SelectorRol() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // ── Estado principal ──────────────────────────────────────────────────────
  const [pin, setPin] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [pinError, setPinError] = useState(false)

  // ── Estado del panel de Personal ──────────────────────────────────────────
  const [mostrarPanelStaff, setMostrarPanelStaff] = useState(false)
  const [pinPersonal, setPinPersonal] = useState('')
  const [staffError, setStaffError] = useState(false)

  // ── Limpiar caché de desarrollo (solo primera vez) ────────────────────────
  React.useEffect(() => {
    if (!localStorage.getItem('swifttable_v2_clean')) {
      localStorage.clear()
      localStorage.setItem('swifttable_v2_clean', 'true')
      window.location.reload()
    }
  }, [])

  // ── Lógica del teclado de PIN de mesa ─────────────────────────────────────
  const handlePadClick = async (num) => {
    if (buscando) return
    const newPin = pin + num
    setPin(newPin)
    setPinError(false)

    if (newPin.length === 4) {
      setBuscando(true)
      try {
        const result = await buscarMesaPorPin(newPin)
        if (result.encontrado) {
          if (result.nombre_restaurante) {
            localStorage.setItem('swifttable_nombre_restaurante', result.nombre_restaurante)
          }
          toast(`¡Mesa ${result.numero_mesa} encontrada! Ingresando...`, 'success')
          setTimeout(() => {
            navigate(`/mesa/${result.id_mesa}/ingreso`)
          }, 400)
        } else {
          setPinError(true)
          toast('PIN no válido. Revisa el número en el centro de tu mesa.', 'error')
          setTimeout(() => {
            setPin('')
            setPinError(false)
          }, 1200)
        }
      } catch {
        setPinError(true)
        toast('Error de conexión. Inténtalo de nuevo.', 'error')
        setTimeout(() => { setPin(''); setPinError(false) }, 1200)
      } finally {
        setBuscando(false)
      }
    }
  }

  const handleDelete = () => {
    if (buscando) return
    setPin(prev => prev.slice(0, -1))
    setPinError(false)
  }

  // ── Lógica del panel de Personal ──────────────────────────────────────────
  const handleEntrarComoPersonal = (e) => {
    e.preventDefault()
    if (pinPersonal === '1234') {
      localStorage.setItem('swifttable_id_restaurante', '1')
      localStorage.setItem('swifttable_nombre_restaurante', 'La Fogata')
      toast('Acceso concedido — La Fogata', 'success')
      navigate('/logistica')
    } else if (pinPersonal === '4321') {
      localStorage.setItem('swifttable_id_restaurante', '2')
      localStorage.setItem('swifttable_nombre_restaurante', 'Pizzería Italia')
      toast('Acceso concedido — Pizzería Italia', 'success')
      navigate('/logistica')
    } else {
      setStaffError(true)
      setPinPersonal('')
      toast('PIN de personal incorrecto.', 'error')
      setTimeout(() => setStaffError(false), 1500)
    }
  }

  // ── Render: Panel Staff (modal/overlay compacto) ───────────────────────────
  if (mostrarPanelStaff) {
    return (
      <>
        <div className="native-app-bar" style={{ background: 'transparent', border: 'none' }}>
          <div className="left-action" />
          <div className="title" style={{ color: 'var(--text-1)' }} />
          <div className="right-action" />
        </div>

        <div className="content-wrapper flex-col" style={{ padding: '0 24px 32px', justifyContent: 'center' }}>

          {/* Logo pequeño */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '18px',
              background: 'linear-gradient(135deg, var(--blue, #3b82f6), #6366f1)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 10px 20px rgba(59, 130, 246, 0.25)'
            }}>
              <Shield size={28} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-1)', marginBottom: '4px' }}>
              Acceso Personal
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: '500' }}>
              Ingresa tu PIN de empleado
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleEntrarComoPersonal} className="card" style={{
            padding: '24px', borderRadius: '20px',
            background: 'var(--surface)', border: '1.5px solid var(--border)'
          }}>
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinPersonal}
                autoFocus
                onChange={(e) => setPinPersonal(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '18px',
                  letterSpacing: '14px',
                  textAlign: 'center',
                  borderRadius: '14px',
                  background: staffError ? 'var(--red-bg, #fef2f2)' : 'var(--bg)',
                  border: staffError
                    ? '2px solid var(--red, #ef4444)'
                    : '2px solid var(--border)',
                  color: 'var(--text-1)',
                  fontSize: '26px',
                  fontWeight: '800',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s, background 0.15s',
                  boxSizing: 'border-box'
                }}
              />
              {staffError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: 'var(--red, #ef4444)', fontSize: '13px', fontWeight: '600' }}>
                  <AlertCircle size={14} /> PIN incorrecto
                </div>
              )}
              <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', textAlign: 'center', marginTop: '6px' }}>
                Demo: 1234 (La Fogata) · 4321 (Pizzería Italia)
              </span>
            </div>

            <button
              type="submit"
              className="wf-btn-solid"
              style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '12px', margin: 0, background: 'var(--blue, #3b82f6)', boxShadow: 'none' }}
            >
              Ingresar al Panel
            </button>
          </form>

          {/* Volver */}
          <button
            onClick={() => { setMostrarPanelStaff(false); setPinPersonal('') }}
            style={{
              marginTop: '20px', background: 'transparent', border: 'none',
              color: 'var(--text-3)', fontSize: '14px', cursor: 'pointer',
              fontWeight: '600', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px'
            }}
          >
            <X size={16} /> Cancelar
          </button>
        </div>
      </>
    )
  }

  // ── Render principal: PIN de mesa ─────────────────────────────────────────
  return (
    <>
      <div className="native-app-bar" style={{ background: 'transparent', border: 'none', backdropFilter: 'none' }}>
        <div className="left-action" />
        <div className="title" style={{ color: 'var(--text-1)' }} />
        <div className="right-action" />
      </div>

      <div className="content-wrapper flex-col" style={{ padding: '0 24px 32px', marginTop: '-12px' }}>

        {/* Logo + Marca */}
        <div style={{ textAlign: 'center', marginBottom: '28px', marginTop: '8px' }}>
          <div style={{
            width: '68px', height: '68px', borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 10px 22px rgba(225, 77, 42, 0.28)'
          }}>
            <Flame size={34} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '30px', letterSpacing: '-0.03em', color: 'var(--text-1)', fontWeight: '800', marginBottom: '2px' }}>
            SwiftTable
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Sistema de Mesa Virtual
          </p>
        </div>

        {/* Bloque PIN */}
        <div className="card animate-fade-in" style={{
          padding: '28px 20px',
          borderRadius: '24px',
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          boxShadow: '0 16px 40px -12px rgba(0,0,0,0.06)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <p style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Ingresa el PIN de tu mesa
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5 }}>
            Encuéntralo en el centro o al costado de la mesa.
          </p>

          {/* Dots de PIN */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: '18px', height: '18px',
                  borderRadius: '50%',
                  transition: 'all 0.15s ease',
                  background: pinError
                    ? 'var(--red, #ef4444)'
                    : i < pin.length
                      ? 'var(--accent)'
                      : 'var(--border)',
                  transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: i < pin.length && !pinError
                    ? '0 0 0 4px rgba(225,77,42,0.15)'
                    : 'none'
                }}
              />
            ))}
          </div>

          {/* Teclado numérico */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            width: '100%',
            maxWidth: '260px'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => pin.length < 4 && handlePadClick(num.toString())}
                disabled={buscando || pin.length >= 4}
                style={{
                  padding: '18px 0',
                  borderRadius: '14px',
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-1)',
                  fontSize: '22px',
                  fontWeight: '700',
                  cursor: buscando || pin.length >= 4 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.1s ease',
                  opacity: buscando ? 0.5 : 1,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--bg)' }}
                onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.94)'; e.currentTarget.style.background = 'var(--surface-2)' }}
                onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--bg)' }}
              >
                {num}
              </button>
            ))}

            {/* Fila inferior: vacío | 0 | borrar */}
            <div />
            <button
              onClick={() => pin.length < 4 && handlePadClick('0')}
              disabled={buscando || pin.length >= 4}
              style={{
                padding: '18px 0',
                borderRadius: '14px',
                border: '1.5px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text-1)',
                fontSize: '22px',
                fontWeight: '700',
                cursor: buscando || pin.length >= 4 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.1s ease',
                opacity: buscando ? 0.5 : 1,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--bg)' }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.94)'; e.currentTarget.style.background = 'var(--surface-2)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--bg)' }}
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={buscando || pin.length === 0}
              style={{
                padding: '18px 0',
                borderRadius: '14px',
                border: '1.5px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-2)',
                fontSize: '18px',
                cursor: buscando || pin.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: buscando || pin.length === 0 ? 0.4 : 1,
                transition: 'all 0.1s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              <Delete size={20} />
            </button>
          </div>

          {/* Spinner mientras busca */}
          {buscando && (
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-3)', fontSize: '13px', fontWeight: '600' }}>
              <div style={{
                width: '16px', height: '16px',
                border: '2px solid var(--border)',
                borderTop: '2px solid var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Buscando mesa...
              <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
            </div>
          )}
        </div>

        {/* Separador + Enlace de Personal — discreto pero visible */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            color: 'var(--text-3)', fontSize: '12px', marginBottom: '16px'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontWeight: '600', letterSpacing: '0.03em' }}>o</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button
            onClick={() => { setMostrarPanelStaff(true); setPin('') }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              color: 'var(--text-2)',
              fontSize: '14px',
              fontWeight: '700',
              fontFamily: 'inherit',
              padding: '8px 16px',
              borderRadius: '10px',
              transition: 'color 0.15s, background 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            <Shield size={16} strokeWidth={2} />
            Soy Personal del Restaurante
          </button>
        </div>

      </div>
    </>
  )
}
