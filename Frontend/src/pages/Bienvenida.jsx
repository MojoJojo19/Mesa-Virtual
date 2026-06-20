import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera } from 'lucide-react'

// QR simulado con patrón visual
function QRSimulado({ mesa }) {
  // Patrón fijo decorativo de celdas para simular un QR
  const pattern = [
    1,1,1,0,1,1,1,
    1,0,1,0,1,0,1,
    1,1,1,1,0,1,1,
    0,1,0,0,0,1,0,
    1,1,1,0,1,1,1,
    1,0,0,1,0,0,1,
    1,1,0,0,1,1,1,
  ]
  return (
    <div className="qr-box">
      <div className="qr-pattern">
        {pattern.map((cell, i) => (
          <div
            key={i}
            className="qr-cell"
            style={{ opacity: cell ? 1 : 0 }}
          />
        ))}
      </div>
    </div>
  )
}

export default function Bienvenida() {
  const { idMesa } = useParams()
  const navigate = useNavigate()

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div className="flex-col flex-1 animate-fade-in">
        {/* Header restaurante */}
        <div className="wf-block text-center" style={{ marginBottom: '16px' }}>
          <div className="wf-label" style={{ textAlign: 'center' }}>Restaurante</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            La Fogata Grill
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Mesa número {idMesa}
          </div>

          <QRSimulado mesa={idMesa} />

          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
            swifttable.pe/m/mesa/{idMesa}
          </div>
        </div>

        {/* Info acceso */}
        <div className="wf-block" style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            <Camera size={24} />
          </div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Sin app · Solo tu cámara
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
            Apunta la cámara al QR o usa el código PIN que el mesero te proporcionará
          </div>
        </div>

        {/* Botones de acceso */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
          <button
            id="btn-acceso-pin"
            className="wf-btn-solid"
            onClick={() => navigate(`/mesa/${idMesa}/pin`)}
          >
            Ingresar con PIN →
          </button>
          <button
            id="btn-acceso-directo"
            className="wf-btn-outline"
            onClick={() => navigate(`/mesa/${idMesa}/ingreso`)}
          >
            Acceso directo
          </button>
        </div>
      </div>
    </>
  )
}
