import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bell, FileText, CheckCircle2 } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function PedidoEnviado() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [minutos, setMinutos] = useState(15)

  useEffect(() => {
    toast('¡Pedido enviado a cocina exitosamente!', 'success')
    const timer = setInterval(() => {
      setMinutos(m => (m > 0 ? m - 1 : 0))
    }, 60000)
    return () => clearInterval(timer)
  }, [toast])

  return (
    <>
      <div className="native-app-bar">
        <div className="left-action"></div>
        <div className="title">Confirmación</div>
        <div className="right-action"></div>
      </div>

      <div className="content-wrapper flex-col">
        
        <div className="card-green text-center animate-fade-in" style={{ padding: '32px 16px', margin: '24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--surface)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <CheckCircle2 size={40} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="title-large" style={{ fontSize: '26px', color: '#166534', marginBottom: '8px' }}>¡Pedido en preparación!</h1>
          <p style={{ fontSize: '15px', color: '#15803d', lineHeight: 1.4 }}>
            La cocina ya recibió su orden.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <div style={{ background: 'var(--surface)', padding: '16px 24px', borderRadius: 'var(--r-full)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiempo estimado</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--green)' }}>{minutos} min</span>
            </div>
          </div>
        </div>

        <div className="section-label" style={{ marginTop: '16px' }}>Opciones de la mesa</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="pago-option" onClick={() => toast('El mozo se acerca a su mesa', 'info')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-bg)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Llamar al Mozo</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>Si necesitas ayuda o algo extra</div>
              </div>
            </div>
          </div>

          <div className="pago-option" onClick={() => navigate(`/mesa/${idMesa}/resumen`)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--purple-bg)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Ver Resumen y Pagar</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>Revisa la cuenta o pide la boleta</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto text-center" style={{ padding: '32px 0 16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-3)', fontWeight: '500' }}>
            ¡Gracias por preferir La Fogata!
          </p>
        </div>

      </div>
    </>
  )
}
