import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, QrCode, Shield, Check, X, AlertCircle } from 'lucide-react'
import { useToast } from '../components/Toast'
import { getMesas } from '../services/api'

export default function SelectorRol() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [rolSeleccionado, setRolSeleccionado] = useState(null) // 'cliente' | 'staff' | null
  const [mesaElegida, setMesaElegida] = useState('')
  const [pinPersonal, setPinPersonal] = useState('')
  const [intentosError, setIntentosError] = useState(false)
  const [mesasDisponibles, setMesasDisponibles] = useState([])

  useEffect(() => {
    // Limpiar caché antigua de desarrollo una sola vez para forzar carga limpia
    if (!localStorage.getItem('swifttable_v2_clean')) {
      localStorage.clear();
      localStorage.setItem('swifttable_v2_clean', 'true');
      window.location.reload();
      return;
    }

    if (rolSeleccionado === 'cliente') {
      const cargarMesas = async () => {
        try {
          const data = await getMesas()
          setMesasDisponibles(data || [])
        } catch (e) {
          console.error(e)
        }
      }
      cargarMesas()
    }
  }, [rolSeleccionado])

  const handleEntrarComoCliente = (e) => {
    e.preventDefault()
    if (!mesaElegida) {
      toast('Por favor, selecciona una mesa', 'error')
      return
    }
    toast(`Accediendo a Mesa ${mesaElegida}`, 'success')
    navigate(`/mesa/${mesaElegida}`)
  }

  const handleEntrarComoPersonal = (e) => {
    e.preventDefault()
    // El PIN de simulación será "4321" o "1234"
    if (pinPersonal === '1234') {
      localStorage.setItem('swifttable_id_restaurante', '1')
      localStorage.setItem('swifttable_nombre_restaurante', 'La Fogata')
      toast('Acceso concedido a Logística - La Fogata', 'success')
      navigate('/logistica')
    } else if (pinPersonal === '4321') {
      localStorage.setItem('swifttable_id_restaurante', '2')
      localStorage.setItem('swifttable_nombre_restaurante', 'Pizzería Italia')
      toast('Acceso concedido a Logística - Pizzería Italia', 'success')
      navigate('/logistica')
    } else {
      setIntentosError(true)
      setPinPersonal('')
      toast('PIN incorrecto. Reintente.', 'error')
      setTimeout(() => setIntentosError(false), 2000)
    }
  }

  return (
    <>
      {/* Native App Bar */}
      <div className="native-app-bar" style={{ background: 'transparent', border: 'none', backdropFilter: 'none' }}>
        <div className="left-action"></div>
        <div className="title" style={{ color: 'var(--text-1)' }}></div>
        <div className="right-action"></div>
      </div>

      <div className="content-wrapper flex-col" style={{ padding: '0 24px 24px', marginTop: '-20px' }}>
        
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
          <div style={{ 
            width: '72px', height: '72px', borderRadius: '22px', 
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 10px 20px rgba(225, 77, 42, 0.25)'
          }}>
            <Flame size={36} strokeWidth={2.5} />
          </div>
          <h1 className="title-large" style={{ fontSize: '32px', letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: '4px' }}>
            SwiftTable
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sistema de Mesa Virtual
          </p>
        </div>

        {rolSeleccionado === null ? (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Opción Cliente (Informativa, exige QR) */}
            <div 
              className="card animate-pop" 
              style={{ 
                padding: '24px', 
                borderRadius: '20px', 
                background: 'var(--surface)', 
                border: '1.5px solid var(--border)',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '14px', 
                background: 'var(--accent-bg)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <QrCode size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-1)', marginBottom: '6px' }}>
                Acceso para Clientes
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                Para empezar a pedir platos, llama al mozo y ver tu cuenta, **por favor escanea el código QR impreso en tu mesa física**.
              </p>
            </div>

            {/* Opción Personal */}
            <div 
              className="card animate-pop" 
              onClick={() => setRolSeleccionado('staff')}
              style={{ 
                padding: '24px', 
                borderRadius: '20px', 
                background: 'var(--surface)', 
                border: '1.5px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '14px', 
                background: 'var(--blue-bg)', color: 'var(--blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-1)', marginBottom: '6px' }}>
                Soy Personal del Restaurante
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.4 }}>
                Acceso KDS para cocina, alertas activas para salón y cobros/boletas en caja registradora.
              </p>
            </div>

          </div>
        ) : (
          /* Formulario Staff / Ingreso de PIN */
          <form onSubmit={handleEntrarComoPersonal} className="card animate-pop" style={{ padding: '24px', borderRadius: '20px', background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--blue)', textTransform: 'uppercase' }}>
                Acceso Personal
              </span>
              <button 
                type="button" 
                onClick={() => { setRolSeleccionado(null); setPinPersonal(''); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                <X size={20} />
              </button>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-1)', marginBottom: '12px' }}>
              Ingresa PIN de Seguridad
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px', lineHeight: '1.4' }}>
              Introduce el PIN de empleado asignado para acceder a los módulos de cocina, meseros y cobros.
            </p>

            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinPersonal}
                onChange={(e) => setPinPersonal(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '16px',
                  letterSpacing: '12px',
                  textAlign: 'center',
                  borderRadius: '12px',
                  background: intentosError ? 'var(--red-bg)' : 'var(--bg)',
                  border: intentosError ? '1.5px solid var(--red)' : '1.5px solid var(--border)',
                  color: 'var(--text-1)',
                  fontSize: '24px',
                  fontWeight: '800',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s'
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', textAlign: 'center', marginTop: '8px' }}>
                PIN Demo: 4321 o 1234
              </span>
            </div>

            <button 
              type="submit" 
              className="wf-btn-solid"
              style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '12px', margin: 0, background: 'var(--blue)', boxShadow: 'none' }}
            >
              Ingresar a Logística
            </button>
          </form>
        )}

      </div>
    </>
  )
}
