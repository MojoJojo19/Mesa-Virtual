import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { validarToken, getMesa, API_URL } from '../services/api'
import { useToast } from '../components/Toast'

export default function Bienvenida() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [verificando, setVerificando] = useState(false)
  const [tokenSesion, setTokenSesion] = useState('')
  const [numeroMesa, setNumeroMesa] = useState(idMesa)
  const [pinMesa, setPinMesa] = useState('----')
  const [qrError, setQrError] = useState(false)

  useEffect(() => {
    const cargarMesa = async () => {
      try {
        const mesa = await getMesa(idMesa)
        if (mesa) {
          setTokenSesion(mesa.token_sesion || '')
          setNumeroMesa(mesa.numero || idMesa)
          setPinMesa(mesa.pin || '----')
        }
      } catch (e) {
        console.error('Error cargando mesa:', e)
      }
    }
    cargarMesa()
  }, [idMesa])

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
      <div className="native-app-bar" style={{ background: 'transparent', border: 'none', backdropFilter: 'none' }}>
        <div className="left-action"></div>
        <div className="title" style={{ color: 'var(--text-1)' }}></div>
        <div className="right-action"></div>
      </div>

      <div className="content-wrapper flex-col" style={{ padding: '0 24px 24px', marginTop: '-40px' }}>
        
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
          <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '150px', height: '150px', background: 'var(--accent)', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%' }} />
          
          <div className="section-label" style={{ color: 'var(--accent)', fontWeight: '800' }}>Escanea para entrar</div>
          <p style={{ fontSize: '15px', color: 'var(--text-2)', marginBottom: '24px', lineHeight: 1.5 }}>
            Apunta la cámara de tu celular al código QR o ingresa con el PIN de la mesa.
          </p>

          <div style={{
            background: '#fff',
            padding: '12px',
            borderRadius: '16px',
            display: 'inline-block',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid var(--border)',
            marginBottom: '12px'
          }}>
            {tokenSesion && !qrError ? (
              <img
                src={`${API_URL}/mesas/${idMesa}/qr_imagen?host=${window.location.origin}`}
                alt={`QR Mesa ${numeroMesa}`}
                style={{ width: '160px', height: '160px', display: 'block', borderRadius: '8px' }}
                onError={() => setQrError(true)}
                key={tokenSesion}
              />
            ) : (
              <div style={{
                width: '160px', height: '160px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '8px', color: 'var(--text-3)'
              }}>
                <div style={{
                  width: '32px', height: '32px',
                  border: '3px solid var(--border)',
                  borderTop: '3px solid var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{ fontSize: '12px' }}>Cargando QR...</span>
              </div>
            )}
          </div>

          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-2)', letterSpacing: '0.05em' }}>
            MESA {numeroMesa} • PIN: {pinMesa}
          </div>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>

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