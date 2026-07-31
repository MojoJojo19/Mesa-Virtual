import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Delete } from 'lucide-react'
import { validarPin } from '../services/api'
import { useToast } from '../components/Toast'
import TopBar from '../components/TopBar'
import StepBar from '../components/StepBar'

export default function PinIngreso() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pin, setPin] = useState('')
  const [cargando, setCargando] = useState(false)

  const handlePadClick = async (num) => {
    if (cargando || pin.length >= 4) return

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
        toast('No pudimos validar el PIN', 'error')
        setPin('')
      } finally {
        setCargando(false)
      }
    }
  }

  const handleDelete = () => {
    if (cargando) return
    setPin(pin.slice(0, -1))
  }

  return (
    <div className="st-screen st-screen--violet">
      <TopBar meta={`Mesa ${idMesa}`} onBack={() => navigate(-1)} />

      <div style={{ padding: '22px 22px 0' }}>
        <StepBar paso={0} />
      </div>

      <div className="st-body" style={{ paddingTop: 26 }}>
        <h1 className="st-h1" style={{ fontSize: 34, textAlign: 'center' }}>
          Escriban el PIN<br />de la mesa
        </h1>
        <p style={{ marginTop: 8, fontSize: 14.5, textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>
          4 dígitos, están en el acrílico del centro
        </p>

        <div className="st-pin-row" style={{ marginTop: 28 }} aria-label={`PIN, ${pin.length} de 4 dígitos`}>
          {[0, 1, 2, 3].map(i => {
            const lleno = i < pin.length
            const activo = i === pin.length && !cargando
            return (
              <div
                key={i}
                className={`st-pin-box ${lleno ? 'st-pin-box--filled' : ''} ${activo ? 'st-pin-box--active' : ''}`}
              >
                {lleno ? pin[i] : activo ? <span className="st-caret" /> : null}
              </div>
            )
          })}
        </div>

        <div className="st-keypad" style={{ marginTop: 'auto' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="st-key" onClick={() => handlePadClick(String(num))} disabled={cargando}>
              {num}
            </button>
          ))}
          <div />
          <button className="st-key" onClick={() => handlePadClick('0')} disabled={cargando}>0</button>
          <button className="st-key st-key--soft" onClick={handleDelete} disabled={cargando} aria-label="Borrar">
            <Delete size={22} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  )
}
