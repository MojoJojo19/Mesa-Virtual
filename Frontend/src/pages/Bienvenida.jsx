import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QrCode, ScanLine, Flame, AlertTriangle } from 'lucide-react'
import { getMesa } from '../services/api'

export default function Bienvenida() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const [nombreRestaurante, setNombreRestaurante] = useState('Cargando...')
  const [errorMesa, setErrorMesa] = useState(false)

  useEffect(() => {
    const cargarDetallesMesa = async () => {
      try {
        const mesa = await getMesa(idMesa)
        // Si el backend responde o el mock nos da un objeto
        if (mesa && mesa.id_mesa) {
          const restName = mesa.restaurante ? mesa.restaurante.nombre : (mesa.nombre_restaurante ? mesa.nombre_restaurante : 'La Fogata')
          setNombreRestaurante(restName)
          localStorage.setItem('swifttable_nombre_restaurante', restName)
        } else {
          setErrorMesa(true)
        }
      } catch (err) {
        console.error("Error cargando mesa:", err)
        setErrorMesa(true)
      }
    }
    cargarDetallesMesa()
  }, [idMesa])

  if (errorMesa) {
    return (
      <div className="content-wrapper flex-col" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '24px', minHeight: '80vh' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--red-bg)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <AlertTriangle size={36} />
        </div>
        <h2 className="title-large" style={{ fontSize: '24px', color: 'var(--text-1)', marginBottom: '8px' }}>Mesa no válida</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '32px' }}>El código QR escaneado no corresponde a ninguna mesa activa del sistema.</p>
        <button className="wf-btn-solid" onClick={() => navigate('/')}>Volver al Selector</button>
      </div>
    )
  }

  return (
    <>
      {/* AppBar Transparente para un look más inmersivo */}
      <div className="native-app-bar" style={{ background: 'transparent', border: 'none', backdropFilter: 'none' }}>
        <div className="left-action"></div>
        <div className="title" style={{ color: 'var(--text-1)' }}></div>
        <div className="right-action"></div>
      </div>

      <div className="content-wrapper flex-col" style={{ padding: '0 24px 24px', marginTop: '-40px' }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '16px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '24px', 
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 12px 24px rgba(225, 77, 42, 0.3)'
          }}>
            <Flame size={40} strokeWidth={2} />
          </div>
          <h1 className="title-large" style={{ fontSize: '36px', letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: '4px' }}>
            {nombreRestaurante}
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-2)', fontWeight: '500' }}>
            Mesa {idMesa}
          </p>
        </div>

        {/* Scanner Card Premium */}
        <div 
          className="card animate-fade-in" 
          style={{ 
            padding: '32px 24px', 
            marginBottom: '32px',
            borderRadius: '24px',
            background: 'linear-gradient(180deg, #ffffff 0%, var(--surface-2) 100%)',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.05)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative glowing orb */}
          <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '150px', height: '150px', background: 'var(--accent)', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%' }} />
          
          <div className="section-label" style={{ color: 'var(--accent)', fontWeight: '800' }}>Empezar a pedir</div>
          <p style={{ fontSize: '15px', color: 'var(--text-2)', marginBottom: '24px', lineHeight: 1.5 }}>
            Ingresa a la mesa utilizando el PIN de seguridad impreso en el acrílico físico de tu mesa.
          </p>
          
          <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Esquinas del scanner simuladas */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '30px', height: '30px', borderTop: '3px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderRadius: '8px 0 0 0' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '30px', height: '30px', borderTop: '3px solid var(--accent)', borderRight: '3px solid var(--accent)', borderRadius: '0 8px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '30px', height: '30px', borderBottom: '3px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderRadius: '0 0 0 8px' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', borderBottom: '3px solid var(--accent)', borderRight: '3px solid var(--accent)', borderRadius: '0 0 8px 0' }} />
            
            <QrCode size={64} color="var(--text-1)" strokeWidth={1} style={{ opacity: 0.8 }} />
            
            {/* Scanning line animation css */}
            <div style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', height: '2px', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', animation: 'scan 2.5s ease-in-out infinite' }} />
          </div>
          
          <style>{`
            @keyframes scan {
              0%, 100% { transform: translateY(0); opacity: 0; }
              10%, 90% { opacity: 1; }
              50% { transform: translateY(112px); }
            }
          `}</style>
        </div>

        {/* Botón de Acceso Principal */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button 
            className="wf-btn-solid" 
            onClick={() => navigate(`/mesa/${idMesa}/pin`)}
            disabled={nombreRestaurante === 'Cargando...'}
          >
            Ingresar a la Mesa
          </button>
        </div>

      </div>
    </>
  )
}
