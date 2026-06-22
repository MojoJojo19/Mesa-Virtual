import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, KeyRound } from 'lucide-react'
import { validarPin } from '../services/api'
import { useToast } from '../components/Toast'

export default function PinIngreso() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pin, setPin] = useState('')
  const [cargando, setCargando] = useState(false)

  const handlePadClick = async (num) => {
    if (cargando) return
    if (pin.length < 4) {
      const newPin = pin + num
      setPin(newPin)
      if (newPin.length === 4) {
        setCargando(true)
        try {
          const esValido = await validarPin(idMesa, newPin)
          if (esValido) {
            toast('PIN correcto', 'success')
            setTimeout(() => navigate(`/mesa/${idMesa}/acceso`), 300)
          } else {
            toast('PIN incorrecto. Inténtalo de nuevo.', 'error')
            setPin('')
          }
        } catch (e) {
          toast('Error al validar PIN', 'error')
          setPin('')
        } finally {
          setCargando(false)
        }
      }
    }
  }

  const handleDelete = () => {
    if (cargando) return
    setPin(pin.slice(0, -1))
  }

  return (
    <>
      <div className="native-app-bar">
        <div className="left-action">
          <button className="wf-btn-ghost" onClick={() => navigate(-1)} style={{ padding: 0 }}>
            <ChevronLeft size={28} color="var(--accent)" />
          </button>
        </div>
        <div className="title">Ingreso</div>
        <div className="right-action"></div>
      </div>

      <div className="content-wrapper flex-col" style={{ justifyContent: 'center' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '16px', 
            background: 'var(--surface)', color: 'var(--text-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <KeyRound size={32} />
          </div>
          <h1 className="title-large" style={{ fontSize: '24px' }}>PIN de la mesa</h1>
          <p className="subtitle">Ingresa los 4 dígitos del centro de mesa</p>
        </div>

        {/* Display de Puntos */}
        <div className="pin-display animate-fade-in">
          {[0,1,2,3].map(i => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
          ))}
        </div>

        {/* Teclado Numérico */}
        <div className="pin-grid animate-fade-in" style={{ maxWidth: '280px', margin: '0 auto' }}>
          {[1,2,3,4,5,6,7,8,9].map(num => (
            <div key={num} className="pin-key" onClick={() => handlePadClick(num.toString())}>
              {num}
            </div>
          ))}
          <div className="pin-key" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
          <div className="pin-key" onClick={() => handlePadClick('0')}>0</div>
          <div className="pin-key" onClick={handleDelete} style={{ background: 'var(--surface-2)', fontSize: '20px' }}>
            ⌫
          </div>
        </div>

      </div>
    </>
  )
}
