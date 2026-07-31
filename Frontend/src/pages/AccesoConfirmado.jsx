import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { nombreRestaurante } from '../theme/sala'

export default function AccesoConfirmado() {
  const { idMesa } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/mesa/${idMesa}/ingreso`)
    }, 1800)
    return () => clearTimeout(timer)
  }, [idMesa, navigate])

  return (
    <div
      className="st-screen st-screen--lime"
      style={{ alignItems: 'center', justifyContent: 'center', gap: 22, padding: 24 }}
      role="status"
    >
      <div
        className="st-tile st-pop"
        style={{
          width: 120,
          height: 120,
          borderRadius: 38,
          background: 'var(--st-ink)',
          color: 'var(--st-lime)',
          boxShadow: '0 10px 0 rgba(0,0,0,0.18)'
        }}
      >
        <Check size={60} strokeWidth={3.2} />
      </div>

      <h1 className="st-h1" style={{ fontSize: 46, textAlign: 'center' }}>¡Estás dentro!</h1>

      <p style={{ fontSize: 17, fontWeight: 600, color: '#2f4410', textAlign: 'center', maxWidth: 280, textWrap: 'pretty' }}>
        Mesa {idMesa} de {nombreRestaurante()} verificada. Armando tu perfil…
      </p>

      <div
        style={{
          width: 180,
          height: 8,
          borderRadius: 999,
          background: 'rgba(21,10,36,0.16)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '42%',
            borderRadius: 999,
            background: 'var(--st-ink)',
            animation: 'st-bar 1.1s ease-in-out infinite'
          }}
        />
      </div>
    </div>
  )
}
