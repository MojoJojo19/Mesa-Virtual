import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const MODOS = [
  { id: 'individual', titulo: 'Pago Individual', desc: 'Cada uno elige sus platos y paga lo suyo' },
  { id: 'partes_iguales', titulo: 'Partes Iguales', desc: 'Pedimos de todo y dividimos la cuenta entre todos' },
  { id: 'lider', titulo: 'Asumir como Líder', desc: 'Yo invito. Pagaré la cuenta total de la mesa' }
]

export default function ModoPago() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const [modoSeleccionado, setModoSeleccionado] = useState(null)

  const handleContinuar = () => {
    if (!modoSeleccionado) return
    const userData = JSON.parse(localStorage.getItem('swifttable_user') || '{}')
    localStorage.setItem('swifttable_user', JSON.stringify({
      ...userData, 
      modoPago: modoSeleccionado, 
      isLider: true // El que configura el pago siempre es el líder de la mesa
    }))
    navigate(`/mesa/${idMesa}/menu`)
  }

  return (
    <>
      <div className="native-app-bar">
        <div className="left-action">
          <button className="wf-btn-ghost" onClick={() => navigate(-1)} style={{ padding: 0 }}>
            <ChevronLeft size={28} color="var(--accent)" />
          </button>
        </div>
        <div className="title">Modo de Pago</div>
        <div className="right-action"></div>
      </div>

      <div className="content-wrapper">
        <div style={{ margin: '16px 0 32px' }}>
          <h1 className="title-large">¿Cómo pagarán hoy?</h1>
          <p className="subtitle">Elige cómo se dividirá la cuenta de la mesa.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {MODOS.map((modo) => (
            <div 
              key={modo.id}
              className={`pago-option ${modoSeleccionado === modo.id ? 'selected' : ''}`}
              onClick={() => setModoSeleccionado(modo.id)}
            >
              <div style={{ flex: 1, paddingRight: '16px' }}>
                <div style={{ fontSize: '17px', fontWeight: '600', marginBottom: '4px' }}>{modo.titulo}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.3 }}>{modo.desc}</div>
              </div>
              <div className="pago-option-radio" />
            </div>
          ))}
        </div>
      </div>

      <div className="native-bottom-bar">
        <button 
          className="wf-btn-solid" 
          onClick={handleContinuar}
          disabled={!modoSeleccionado}
        >
          Continuar al Menú
        </button>
      </div>
    </>
  )
}
