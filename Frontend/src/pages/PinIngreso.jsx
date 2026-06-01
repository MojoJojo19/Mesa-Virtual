import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../components/Toast'

const PIN_CORRECTO = '7823' // PIN de demo — en producción lo valida el backend

export default function PinIngreso() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const handleKey = (digit) => {
    if (pin.length >= 4) return
    const nuevoPin = pin + digit
    setPin(nuevoPin)
    setError(false)

    if (nuevoPin.length === 4) {
      setTimeout(() => {
        if (nuevoPin === PIN_CORRECTO || true) { // Acepta cualquier PIN de 4 dígitos en demo
          toast('✓ PIN correcto — Mesa verificada', 'success', 2000)
          navigate(`/mesa/${idMesa}/acceso`)
        } else {
          setShake(true)
          toast('PIN incorrecto, intenta de nuevo', 'error')
          setTimeout(() => { setPin(''); setShake(false); setError(true) }, 600)
        }
      }, 300)
    }
  }

  const handleBorrar = () => {
    setPin(prev => prev.slice(0, -1))
    setError(false)
  }

  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓']

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div className="flex-col flex-1 animate-fade-in">
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h1 className="title-main">Ingresa el PIN</h1>
          <p className="subtitle">El mesero te dará el PIN de 4 dígitos</p>
        </div>

        {/* Display PIN */}
        <div
          className="pin-display"
          style={{
            transform: shake ? 'translateX(-8px)' : 'translateX(0)',
            transition: shake ? 'transform 0.1s ease' : 'transform 0.3s ease'
          }}
        >
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        {error && (
          <div style={{
            textAlign: 'center', fontSize: '12px',
            color: '#f87171', marginBottom: '8px', animate: 'fadeIn 0.3s ease'
          }}>
            PIN incorrecto — intenta de nuevo
          </div>
        )}

        {/* Teclado numérico */}
        <div className="pin-grid">
          {keys.map(k => (
            <button
              key={k}
              id={`pin-key-${k}`}
              className="pin-key"
              onClick={() => {
                if (k === '⌫') handleBorrar()
                else if (k === '✓') { /* confirmar — ya se confirma automático */ }
                else handleKey(k)
              }}
              style={k === '✓' ? { fontSize: '16px', color: 'var(--color-accent)' } : {}}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Link alternativo */}
        <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '10px' }}>
            ¿Problemas con el PIN?
          </div>
          <button
            className="wf-btn-ghost"
            onClick={() => navigate(`/mesa/${idMesa}/ingreso`)}
          >
            Ingresar directamente →
          </button>
        </div>
      </div>
    </>
  )
}
