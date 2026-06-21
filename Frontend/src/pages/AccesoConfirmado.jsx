import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'

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
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="check-circle" style={{ 
        width: '80px', height: '80px', borderRadius: '50%', 
        background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '24px', animation: 'scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <Check size={40} color="var(--green)" strokeWidth={3} />
      </div>
      <h2 className="title-large" style={{ fontSize: '26px' }}>Mesa Encontrada</h2>
      <p className="subtitle">Conectando de forma segura...</p>
    </div>
  )
}
