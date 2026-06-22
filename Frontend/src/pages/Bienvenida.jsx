import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { QrCode, Flame } from 'lucide-react'
import { validarToken } from '../services/api'
import { useToast } from '../components/Toast'

export default function Bienvenida() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [verificando, setVerificando] = useState(false)

  useEffect(() => {
    const verificarAccesoToken = async () => {
      const queryParams = new URLSearchParams(location.search)
      const token = queryParams.get('token')
      
      if (token) {
        setVerificando(true)
        try {
          const esValido = await validarToken(idMesa, token)
          if (esValido) {
            toast('Enlace verificado por código QR', 'success')
            localStorage.setItem(`swifttable_token_sesion_${idMesa}`, token)
            setTimeout(() => {
              navigate(`/mesa/${idMesa}/ingreso`)
            }, 800)
            return
          } else {
            toast('El código QR ha expirado. Por favor ingresa usando el PIN actual.', 'error')
          }
        } catch (e) {
          console.error("Error al validar token de sesión:", e)
        } finally {
          setVerificando(false)
        }
      }
    }
    verificarAccesoToken()
  }, [idMesa, location.search, navigate, toast])

  if (verificando) {
    return (
      <div className="content-wrapper flex-col" style={{ justifyContent: 'center', alignItems: 'center', height: '90vh', gap: '16px' }}>
        <div style={{
          width: '40px', height: '40px',
          border: '4px solid var(--border)',
          borderTop: '4px solid var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ fontWeight: '700', color: 'var(--text-2)', fontSize: '15px' }}>
          Verificando enlace de mesa...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
          <h1 className="title-large" style={{ fontSize: '32px', letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: '4px' }}>
            Mesa Virtual
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-2)', fontWeight: '500' }}>
            Bienvenido al Sistema de Pedidos
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
            <div style={{ position: 'absolute', top: 0, left: 0, width: '30px', height: '30px', borderTop: '3px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderRadius: '8px 0 0 0' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '30px', height: '30px', borderTop: '3px solid var(--accent)', borderRight: '3px solid var(--accent)', borderRadius: '0 8px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '30px', height: '30px', borderBottom: '3px solid var(--accent)', borderLeft: '3px solid var(--accent)', borderRadius: '0 0 0 8px' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px', borderBottom: '3px solid var(--accent)', borderRight: '3px solid var(--accent)', borderRadius: '0 0 8px 0' }} />
            
            <QrCode size={64} color="var(--text-1)" strokeWidth={1} style={{ opacity: 0.8 }} />
            
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
          >
            Ingresar a la Mesa
          </button>
        </div>

      </div>
    </>
  )
}
