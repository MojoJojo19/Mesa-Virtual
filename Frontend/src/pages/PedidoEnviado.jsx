import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { llamarMesero } from '../services/api'
import { useToast } from '../components/Toast'
import { Bell, FileText, Plus } from 'lucide-react'

// Timer visual circular animado
function TimerCirculo({ minutos }) {
  const radio = 28
  const circunferencia = 2 * Math.PI * radio
  const totalSeg = minutos * 60
  const [segRestantes, setSegRestantes] = useState(totalSeg)

  useEffect(() => {
    if (segRestantes <= 0) return
    const id = setInterval(() => setSegRestantes(s => Math.max(s - 1, 0)), 1000)
    return () => clearInterval(id)
  }, [segRestantes])

  const progreso = segRestantes / totalSeg
  const offset = circunferencia * (1 - progreso)
  const min = Math.floor(segRestantes / 60)
  const seg = segRestantes % 60

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx="36" cy="36" r={radio}
          fill="none" stroke="var(--color-border-tertiary)" strokeWidth="4" />
        {/* Progreso */}
        <circle cx="36" cy="36" r={radio}
          fill="none"
          stroke={segRestantes > 60 ? 'var(--color-accent)' : '#f87171'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
        />
      </svg>
      <div style={{ position: 'absolute', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
        {min}:{seg.toString().padStart(2, '0')}
      </div>
    </div>
  )
}

export default function PedidoEnviado() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [meseroLlamado, setMeseroLlamado] = useState(false)
  const [cuentaSolicitada, setCuentaSolicitada] = useState(false)
  const TIEMPO_ESTIMADO = 15 // minutos

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{}')
  const miPedido = JSON.parse(localStorage.getItem('swifttable_carrito') || '[]')
  const totalMiPedido = miPedido.reduce((s, p) => s + Number(p.precio || 0) * (p.cantidad || 1), 0)
  const notaPedido = miPedido[0]?.nota || ''

  const handleLlamarMesero = async () => {
    if (meseroLlamado) {
      toast('Ya llamaste al mesero, está en camino', 'info')
      return
    }
    await llamarMesero(idMesa)
    setMeseroLlamado(true)
    toast('¡Mesero notificado! Llegará en breve', 'success')
    setTimeout(() => setMeseroLlamado(false), 60000)
  }

  const handleSolicitarCuenta = () => {
    setCuentaSolicitada(true)
    toast('Cuenta solicitada, te la llevamos a la mesa', 'success')
    setTimeout(() => navigate(`/mesa/${idMesa}/resumen`), 1500)
  }

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div className="flex-col flex-1 animate-fade-in">

        {/* Confirmación + timer */}
        <div className="wf-block animate-scale-in" style={{
          borderColor: 'var(--color-success)',
          background: 'var(--color-success-dim)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
              <TimerCirculo minutos={TIEMPO_ESTIMADO} />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '3px' }}>
                ✓ Pedido en cocina
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                Tiempo estimado: <strong style={{ color: 'var(--color-accent)' }}>~{TIEMPO_ESTIMADO} min</strong>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                El timer se actualiza en tiempo real
              </div>
            </div>
          </div>
        </div>

        {/* Asistencia virtual */}
        <div className="wf-label" style={{ marginBottom: '10px' }}>¿Necesitas algo más?</div>

        <div id="btn-llamar-mesero" className="asistencia-item animate-fade-in stagger-1"
          onClick={handleLlamarMesero}
          style={meseroLlamado ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-dim)' } : {}}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className="asistencia-icon" style={{ color: meseroLlamado ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
              <Bell size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: meseroLlamado ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                {meseroLlamado ? '¡Mesero en camino!' : 'Llamar al mesero'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {meseroLlamado ? 'Llegará en breve a tu mesa' : 'El personal llegará en breve'}
              </div>
            </div>
          </div>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '16px' }}>›</span>
        </div>

        <div id="btn-solicitar-cuenta" className="asistencia-item animate-fade-in stagger-2"
          onClick={handleSolicitarCuenta}
          style={cuentaSolicitada ? { borderColor: 'var(--color-success)', background: 'var(--color-success-dim)' } : {}}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className="asistencia-icon" style={{ color: cuentaSolicitada ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: cuentaSolicitada ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                {cuentaSolicitada ? 'Preparando tu cuenta...' : 'Solicitar la cuenta'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Te la llevamos a la mesa
              </div>
            </div>
          </div>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '16px' }}>›</span>
        </div>

        <div id="btn-agregar-platos" className="asistencia-item animate-fade-in stagger-3"
          onClick={() => navigate(`/mesa/${idMesa}/menu`)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className="asistencia-icon" style={{ color: 'var(--color-text-secondary)' }}>
              <Plus size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>Agregar más platos</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Volver al menú</div>
            </div>
          </div>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '16px' }}>›</span>
        </div>

        {/* Mi pedido */}
        <div className="wf-label" style={{ marginTop: '6px', marginBottom: '10px' }}>Mi pedido</div>
        <div className="wf-block" style={{ marginBottom: 0 }}>
          {miPedido.length > 0 ? (
            <>
              {miPedido.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: i < miPedido.length - 1 ? '8px' : '0'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {p.icon} {p.nombre}
                    {p.cantidad > 1 && (
                      <span style={{ color: 'var(--color-accent)', fontWeight: '600', marginLeft: '5px' }}>
                        ×{p.cantidad}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    S/ {(Number(p.precio) * (p.cantidad || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
              {notaPedido && (
                <div style={{
                  marginTop: '10px', padding: '8px 10px', borderRadius: '8px',
                  background: 'var(--color-background-secondary)',
                  fontSize: '11px', color: 'var(--color-text-tertiary)',
                  borderLeft: '2px solid var(--color-border-secondary)'
                }}>
                  📝 {notaPedido}
                </div>
              )}
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Total mi pedido</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-accent)' }}>
                  S/ {totalMiPedido.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            // Datos demo si no hay carrito
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>🍗 Pollo a la brasa 1/4</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>S/ 18.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>🥤 Inca Kola 500ml</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>S/ 5.00</span>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Total</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-accent)' }}>S/ 23.00</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
