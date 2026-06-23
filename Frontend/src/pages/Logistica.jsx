import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, FileText, ChevronLeft, RefreshCw, CheckCircle, Clock, Plus, Volume2, VolumeX, X, User, Utensils, LayoutGrid, ChefHat, ConciergeBell, Receipt, DollarSign, QrCode, Minus } from 'lucide-react'
import { getAsistencias, atenderAsistencia, simularLlamadoDesdePanel, getMesas, liberarMesa, getPedidosDeMesa, registrarPago, actualizarEstadoPedido, getPagos, getPedidosTodos, getRestaurante, actualizarTiempoEspera, actualizarTiempoEsperaMesa, API_URL } from '../services/api'
import { useToast } from '../components/Toast'

export default function Logistica() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [asistencias, setAsistencias] = useState([])
  const [mesas, setMesas] = useState([])
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [pedidosMesa, setPedidosMesa] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('pendientes') // 'todos', 'pendientes', 'atendidos', 'mozo', 'cuenta'
  const [mesaSimulada, setMesaSimulada] = useState(3)
  const [tipoSimulado, setTipoSimulado] = useState('llamar_mesero')
  const [tick, setTick] = useState(0)
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [mesaALiberar, setMesaALiberar] = useState(null)
  
  // Nuevos estados para Caja, Cocina y Salón
  const [vistaModo, setVistaModo] = useState('salon') // 'salon', 'cocina', 'caja'
  const [pagos, setPagos] = useState([])
  const [todosPedidos, setTodosPedidos] = useState([])
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null)
  const [tiempoEsperaGlobal, setTiempoEsperaGlobal] = useState(15)

  const asistenciasPrevias = useRef(new Set())
  const timeoutExtraTimeRefs = useRef({})
  const audioCtxRef = useRef(null)

  const obtenerNumeroMesa = (idMesa) => {
    const mesa = mesas.find(m => m.id_mesa === parseInt(idMesa))
    return mesa ? mesa.numero : idMesa
  }

  // Inicializar o reanudar el contexto de audio mediante interacción del usuario
  const iniciarAudio = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (AudioContext) {
          audioCtxRef.current = new AudioContext()
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
    } catch (e) {
      console.warn("No se pudo iniciar el contexto de audio:", e)
    }
  }

  // Escuchar interacciones para desbloquear el audio (Autoplay Policy de los navegadores)
  useEffect(() => {
    const habilitarAudioGestos = () => {
      iniciarAudio()
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        window.removeEventListener('click', habilitarAudioGestos)
        window.removeEventListener('touchstart', habilitarAudioGestos)
      }
    }
    window.addEventListener('click', habilitarAudioGestos)
    window.addEventListener('touchstart', habilitarAudioGestos)
    return () => {
      window.removeEventListener('click', habilitarAudioGestos)
      window.removeEventListener('touchstart', habilitarAudioGestos)
    }
  }, [])

  // Sintetizador Web Audio para un sonido limpio y compatible sin requerir archivos externos
  const reproducirSonidoAlerta = () => {
    try {
      iniciarAudio()
      const ctx = audioCtxRef.current
      if (!ctx || ctx.state === 'suspended') return
      
      const playNote = (time, freq, duration) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, time)
        
        gain.gain.setValueAtTime(0.15, time)
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start(time)
        osc.stop(time + duration)
      }

      const now = ctx.currentTime
      // Doble tono agradable (Ding-Dong)
      playNote(now, 587.33, 0.3) // Re5
      playNote(now + 0.12, 880, 0.45) // La5
    } catch (e) {
      console.warn("Sonido bloqueado por restricciones del navegador:", e)
    }
  }

  const idRestaurante = parseInt(localStorage.getItem('swifttable_id_restaurante')) || null
  const nombreRestaurante = localStorage.getItem('swifttable_nombre_restaurante') || 'SwiftTable'

  // Polling y carga inicial
  const cargarDatos = async (mostrarToast = false) => {
    try {
      const restId = idRestaurante
      const [datosAsist, datosMesas, datosPagos, datosPedidos, datosRest] = await Promise.all([
        getAsistencias(restId),
        getMesas(restId),
        getPagos(restId),
        getPedidosTodos(restId),
        getRestaurante(restId)
      ])
      
      // Procesar asistencias
      const ordenados = (datosAsist || []).sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
      const pendientesActuales = (datosAsist || []).filter(a => a.estado === 'pendiente')
      if (asistenciasPrevias.current.size > 0 && sonidoHabilitado) {
        const hayNuevas = pendientesActuales.some(a => !asistenciasPrevias.current.has(a.id_asistencia))
        if (hayNuevas) {
          reproducirSonidoAlerta()
        }
      }
      asistenciasPrevias.current = new Set(pendientesActuales.map(a => a.id_asistencia))
      setAsistencias(ordenados)

      // Procesar mesas
      setMesas(datosMesas || [])
      
      // Guardar pagos y pedidos globales
      setPagos(datosPagos || [])
      setTodosPedidos(datosPedidos || [])
      
      if (datosRest && datosRest.tiempo_espera_global) {
        setTiempoEsperaGlobal(datosRest.tiempo_espera_global)
      }

      // Actualizar mesa seleccionada si ya hay una abierta
      setMesaSeleccionada(prev => {
        if (!prev) return null;
        const actualizada = (datosMesas || []).find(m => m.id_mesa === prev.id_mesa);
        return actualizada || null;
      });

      if (mostrarToast) {
        toast('Datos actualizados', 'success')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    // Polling cada 5 segundos
    const interval = setInterval(() => {
      cargarDatos()
    }, 5000)

    // Timer para actualizar el contador de tiempo relativo cada segundo
    const timer = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(timer)
    }
  }, [])

  // Cargar pedidos al cambiar selección o cuando se actualizan todosPedidos
  useEffect(() => {
    if (mesaSeleccionada) {
      const peds = todosPedidos.filter(p => p.id_mesa === mesaSeleccionada.id_mesa && p.estado !== 'pagado' && p.estado !== 'cancelado');
      setPedidosMesa(peds);
    } else {
      setPedidosMesa([]);
    }
  }, [mesaSeleccionada, todosPedidos])

  // Acción para atender llamado
  const handleAtender = async (id) => {
    try {
      await atenderAsistencia(id)
      toast('Llamado marcado como atendido', 'success')
      setAsistencias(prev => prev.map(a => 
        a.id_asistencia === id ? { ...a, estado: 'atendido' } : a
      ))
    } catch (e) {
      toast('Error al actualizar estado', 'error')
    }
  }

  // Acción para liberar mesa
  const handleLiberarMesa = (idMesa) => {
    setMesaALiberar(idMesa)
    setConfirmModalOpen(true)
  }

  const confirmarLiberarMesa = async () => {
    if (!mesaALiberar) return
    setConfirmModalOpen(false)
    try {
      const mesaLiberada = await liberarMesa(mesaALiberar)
      toast(`Mesa ${mesaALiberar} liberada.`, 'success')
      
      // Actualizar listado local de mesas
      setMesas(prev => prev.map(m => m.id_mesa === mesaALiberar ? mesaLiberada : m))
      
      // Cerrar o actualizar selección
      setMesaSeleccionada(null)
      setMesaALiberar(null)
      cargarDatos()
    } catch (e) {
      toast('Error al liberar la mesa', 'error')
    }
  }

  const handleSimularAction = async (tipo) => {
    try {
      await simularLlamadoDesdePanel(mesaSimulada, tipo)
      toast(`Simulación: ${tipo === 'llamar_mesero' ? 'Llamar mozo' : 'Pedir cuenta'} - Mesa ${mesaSimulada}`, 'success')
      cargarDatos()
    } catch (e) {
      toast('Error en simulación', 'error')
    }
  }

  const handleActualizarTiempoEspera = async (nuevoTiempo) => {
    if (nuevoTiempo < 5) return;
    setTiempoEsperaGlobal(nuevoTiempo)
    try {
      await actualizarTiempoEspera(idRestaurante, nuevoTiempo)
      toast(`Tiempo de espera actualizado a ${nuevoTiempo} min`, 'success')
    } catch (e) {
      toast('Error al actualizar tiempo', 'error')
    }
  }

  const handleActualizarTiempoEsperaMesa = (idMesa, nuevoTiempoExtra) => {
    // Actualización optimista para que la UI responda instantáneamente
    setMesas(prev => prev.map(m => m.id_mesa === idMesa ? { ...m, tiempo_espera_adicional: nuevoTiempoExtra } : m));
    
    if (timeoutExtraTimeRefs.current[idMesa]) {
      clearTimeout(timeoutExtraTimeRefs.current[idMesa]);
    }

    timeoutExtraTimeRefs.current[idMesa] = setTimeout(async () => {
      try {
        await actualizarTiempoEsperaMesa(idMesa, nuevoTiempoExtra)
        toast(`Tiempo extra actualizado a ${nuevoTiempoExtra} min para la Mesa ${idMesa}`, 'success')
      } catch (e) {
        toast('Error al actualizar tiempo extra de la mesa', 'error')
        cargarDatos() // Revertir en caso de error
      }
    }, 500);
  }

  const cambiarEstadoPedidoClick = async (idPedido, nuevoEstado) => {
    try {
      await actualizarEstadoPedido(idPedido, nuevoEstado)
      toast(`Pedido actualizado a: ${nuevoEstado === 'listo_para_servir' ? 'Listo' : 'Servido'}`, 'success')
      cargarDatos()
    } catch (e) {
      toast('Error al actualizar estado del pedido', 'error')
    }
  }

  const handleRegistrarPagoCerrar = async () => {
    if (!mesaSeleccionada) return
    const subtotal = pedidosMesa.reduce((acc, ped) => {
      return acc + ped.items.reduce((s, it) => s + (Number(it.precio) * it.cantidad), 0)
    }, 0)
    const totalPagar = subtotal * 1.10

    try {
      const primerPedido = pedidosMesa[0]
      if (primerPedido) {
        await registrarPago(primerPedido.id_pedido, totalPagar, 0, 'efectivo')
      }
      
      const mesaLiberada = await liberarMesa(mesaSeleccionada.id_mesa)
      toast(`Pago de S/ ${totalPagar.toFixed(2)} registrado en Caja. Mesa ${mesaSeleccionada.numero} liberada.`, 'success')
      
      setMesas(prev => prev.map(m => m.id_mesa === mesaSeleccionada.id_mesa ? mesaLiberada : m))
      setMesaSeleccionada(null)
      cargarDatos()
    } catch (e) {
      toast('Error al registrar pago en Caja', 'error')
    }
  }

  const handlePrintQR = (mesa) => {
    const printWindow = window.open('', '_blank')
    const qrUrl = `${API_URL}/mesas/${mesa.id_mesa}/qr_imagen?host=${window.location.origin}`
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir QR - Mesa ${mesa.numero}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              text-align: center;
              margin: 0;
              padding: 40px;
              color: #0f172a;
              background-color: #fff;
            }
            .card {
              border: 3px solid #0f172a;
              border-radius: 24px;
              padding: 40px;
              max-width: 320px;
              margin: 0 auto;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            h1 {
              font-size: 28px;
              margin: 0 0 5px 0;
              font-weight: 800;
              letter-spacing: -0.02em;
            }
            h2 {
              font-size: 20px;
              color: #64748b;
              margin-top: 0;
              margin-bottom: 24px;
              font-weight: 600;
            }
            .qr-img {
              width: 220px;
              height: 220px;
              margin: 10px auto;
              display: block;
            }
            .instructions {
              font-size: 14px;
              color: #475569;
              margin-top: 24px;
              line-height: 1.5;
              font-weight: 600;
            }
            .pin {
              display: inline-block;
              background: #f1f5f9;
              padding: 6px 16px;
              border-radius: 12px;
              font-size: 20px;
              font-weight: 800;
              margin-top: 10px;
              color: #0f172a;
              border: 1px solid #cbd5e1;
              letter-spacing: 2px;
            }
            @media print {
              body { padding: 0; background-color: #fff; }
              .card { box-shadow: none; border: 3px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>LA FOGATA</h1>
            <h2>MESA ${mesa.numero}</h2>
            <img class="qr-img" src="${qrUrl}" alt="Código QR" />
            <div class="instructions">
              Escanea el código QR para realizar tu pedido desde tu celular.<br/>
              O ingresa con el PIN en la pantalla de la mesa:
              <br/>
              <div class="pin">${mesa.pin || '----'}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Simulación
  const handleSimular = () => {
    simularLlamadoDesdePanel(mesaSimulada, tipoSimulado)
    toast(`Llamado simulado en Mesa ${mesaSimulada}`, 'info')
    
    // Si la mesa simulada está en nuestro listado de mesas, marcarla como ocupada localmente
    setMesas(prev => prev.map(m => {
      if (m.id_mesa === parseInt(mesaSimulada) && m.estado === 'libre') {
        return { 
          ...m, 
          estado: 'ocupada', 
          comensales: [{ nombre: 'Simulado', avatar: '' }] 
        }
      }
      return m
    }))

    if (sonidoHabilitado) {
      reproducirSonidoAlerta()
    }
    cargarDatos()
  }

  // Helper de tiempo relativo
  const obtenerTiempoTranscurrido = (fechaStr) => {
    const ahora = new Date()
    const fecha = new Date(fechaStr)
    const diffMs = ahora - fecha
    const diffSec = Math.floor(diffMs / 1000)
    
    if (diffSec < 0) return 'Ahora mismo'
    if (diffSec < 60) return `Hace ${diffSec}s`
    
    const diffMin = Math.floor(diffSec / 60)
    const segundosRestantes = diffSec % 60
    return `Hace ${diffMin}m ${segundosRestantes}s`
  }

  // Filtrar asistencias
  const asistenciasFiltradas = asistencias.filter(a => {
    if (filtro === 'pendientes') return a.estado === 'pendiente'
    if (filtro === 'atendidos') return a.estado === 'atendido'
    if (filtro === 'mozo') return a.tipo === 'llamar_mesero' && a.estado === 'pendiente'
    if (filtro === 'cuenta') return a.tipo === 'pedir_cuenta' && a.estado === 'pendiente'
    return true // 'todos'
  })

  // Estadísticas
  const totalPendientes = asistencias.filter(a => a.estado === 'pendiente').length
  const totalMozos = asistencias.filter(a => a.tipo === 'llamar_mesero' && a.estado === 'pendiente').length
  const totalCuentas = asistencias.filter(a => a.tipo === 'pedir_cuenta' && a.estado === 'pendiente').length

  // Métodos de renderizado auxiliar para los diferentes modos de logística
  const renderSelectorModo = () => {
    return (
      <div className="category-tabs" style={{ marginBottom: '20px', background: 'var(--surface)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '4px' }}>
        {[
          { id: 'salon', label: 'Salón', icon: ConciergeBell },
          { id: 'cocina', label: 'Cocina', icon: ChefHat },
          { id: 'caja', label: 'Caja', icon: Receipt },
          { id: 'historial', label: 'Historial', icon: FileText }
        ].map(mode => {
          const Icon = mode.icon
          const active = vistaModo === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => {
                setVistaModo(mode.id)
                setMesaSeleccionada(null)
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 4px',
                fontSize: '13px',
                fontWeight: '700',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: active ? 'var(--dark-action)' : 'transparent',
                color: active ? 'white' : 'var(--text-2)',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={16} />
              <span>{mode.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  const renderCocinaKDS = () => {
    const comandasCocina = todosPedidos.filter(p => p.estado === 'pendiente' || p.estado === 'en_preparacion')

    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-1)' }}>
              Pantalla de Cocina (KDS)
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Tiempo de Espera Global:</span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', borderRadius: '20px', padding: '4px' }}>
                <button 
                  onClick={() => handleActualizarTiempoEspera(tiempoEsperaGlobal - 5)}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ margin: '0 12px', fontSize: '14px', fontWeight: 'bold' }}>{tiempoEsperaGlobal} min</span>
                <button 
                  onClick={() => handleActualizarTiempoEspera(tiempoEsperaGlobal + 5)}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
          <span className="category-tab active" style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--accent)' }}>
            {comandasCocina.length} Comandas en Espera
          </span>
        </div>

        {comandasCocina.length === 0 ? (
          <div className="card text-center" style={{ padding: '48px 16px', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={32} />
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>¡Cocina al día!</div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>No hay comandas pendientes de preparación.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {comandasCocina.map(com => (
              <div key={com.id_pedido} className="card animate-pop" style={{ padding: '16px', borderLeft: '4px solid var(--accent)', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-1)' }}>
                      Mesa {obtenerNumeroMesa(com.id_mesa)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                      Pedido #{com.id_pedido} • {obtenerTiempoTranscurrido(com.fecha_hora)}
                    </div>
                  </div>
                  <span className="category-tab" style={{ fontSize: '10px', background: 'var(--accent-bg)', color: 'var(--accent)', boxShadow: 'none' }}>
                    {com.estado === 'pendiente' ? 'Pendiente' : 'Preparando'}
                  </span>
                </div>

                <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                  {com.items && com.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0', borderBottom: idx < com.items.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-1)' }}>{it.cantidad}x</span>
                      <span style={{ flex: 1, marginLeft: '8px', color: 'var(--text-2)' }}>{it.nombre}</span>
                    </div>
                  ))}
                </div>

                {/* Control de Tiempo Extra por Mesa */}
                {(() => {
                  const mesaInfo = mesas.find(m => m.id_mesa === com.id_mesa)
                  const extraTime = mesaInfo ? (mesaInfo.tiempo_espera_adicional || 0) : 0
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Tiempo Extra:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => handleActualizarTiempoEsperaMesa(com.id_mesa, extraTime - 5)}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
                          {extraTime > 0 ? `+${extraTime}` : extraTime} min
                        </span>
                        <button 
                          onClick={() => handleActualizarTiempoEsperaMesa(com.id_mesa, extraTime + 5)}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })()}

                <button
                  onClick={() => cambiarEstadoPedidoClick(com.id_pedido, 'listo_para_servir')}
                  className="wf-btn-solid"
                  style={{
                    background: 'var(--green)',
                    fontSize: '14px',
                    padding: '12px',
                    borderRadius: '10px',
                    width: '100%',
                    margin: 0,
                    boxShadow: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle size={16} /> ¡Listo en Barra!
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderCajaRegistradora = () => {
    const totalVentas = pagos.reduce((acc, p) => acc + Number(p.monto_total || 0), 0)
    const totalPropinas = pagos.reduce((acc, p) => acc + Number(p.propina || 0), 0)
    const totalEfectivo = pagos.filter(p => p.metodo_pago === 'efectivo').reduce((acc, p) => acc + Number(p.monto_total || 0), 0)
    const totalTarjeta = pagos.filter(p => p.metodo_pago === 'tarjeta').reduce((acc, p) => acc + Number(p.monto_total || 0), 0)
    const totalYapePlin = pagos.filter(p => p.metodo_pago === 'yape' || p.metodo_pago === 'plin').reduce((acc, p) => acc + Number(p.monto_total || 0), 0)

    return (
      <div className="animate-fade-in">
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-1)', marginBottom: '16px' }}>
          Control de Caja Registradora
        </h2>

        {/* Caja Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '12px', margin: 0, textAlign: 'center', borderTop: '4px solid var(--green)', borderBottom: 'none' }}>
            <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Ventas del Día</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--green)' }}>
              S/ {totalVentas.toFixed(2)}
            </div>
          </div>
          <div className="card" style={{ padding: '12px', margin: 0, textAlign: 'center', borderTop: '4px solid var(--purple)', borderBottom: 'none' }}>
            <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Propinas</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--purple)' }}>
              S/ {totalPropinas.toFixed(2)}
            </div>
          </div>
          <div className="card" style={{ padding: '12px', margin: 0, textAlign: 'center', borderTop: '4px solid var(--accent)', borderBottom: 'none' }}>
            <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Efectivo</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>
              S/ {totalEfectivo.toFixed(2)}
            </div>
          </div>
          <div className="card" style={{ padding: '12px', margin: 0, textAlign: 'center', borderTop: '4px solid var(--blue)', borderBottom: 'none' }}>
            <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Tarjeta</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>
              S/ {totalTarjeta.toFixed(2)}
            </div>
          </div>
          <div className="card" style={{ padding: '12px', margin: 0, textAlign: 'center', borderTop: '4px solid var(--yellow)', borderBottom: 'none' }}>
            <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Yape / Plin</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>
              S/ {totalYapePlin.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-1)' }}>
              Historial de Boletas ({pagos.length})
            </span>
          </div>

          {pagos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-3)' }}>
              No hay pagos registrados hoy.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {pagos.map((p, idx) => (
                <div 
                  key={p.id_pago} 
                  className="list-item" 
                  style={{ 
                    padding: '16px', 
                    borderBottom: idx < pagos.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    display: 'flex',
                    background: 'var(--surface)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-1)' }}>
                      Mesa {obtenerNumeroMesa(p.id_mesa)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                      Pago #{p.id_pago} • {new Date(p.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--green)' }}>
                        S/ {Number(p.monto_total).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-2)' }}>
                        {p.metodo_pago.toUpperCase()} {p.propina > 0 && `(Prop. S/ ${Number(p.propina).toFixed(2)})`}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setTicketSeleccionado(p)
                        setTicketModalOpen(true)
                      }}
                      className="wf-btn-outline"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        margin: 0,
                        border: '1px solid var(--border-2)',
                        boxShadow: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Ver Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTicketModal = () => {
    if (!ticketSeleccionado) return null
    const subtotal = Number(ticketSeleccionado.monto_total || 0) - Number(ticketSeleccionado.propina || 0)
    const baseVal = subtotal / 1.10
    const servicioVal = baseVal * 0.10

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '24px'
      }}>
        <div className="card animate-pop" style={{ maxWidth: '380px', width: '100%', padding: '24px', margin: 0, background: '#fff', color: '#000', border: '2px dashed #94a3b8', fontFamily: 'inherit', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px', color: '#0f172a', fontFamily: 'var(--font-display)' }}>LA FOGATA S.A.C.</h3>
            <p style={{ fontSize: '11px', margin: '2px 0', color: 'var(--text-2)' }}>AV. UNIVERSITARIA 1801, LIMA</p>
            <p style={{ fontSize: '11px', margin: '2px 0', color: 'var(--text-2)' }}>R.U.C. 20456789123</p>
            <p style={{ fontSize: '12px', margin: '8px 0 0', fontWeight: '700' }}>BOLETA DE VENTA ELECTRÓNICA</p>
            <p style={{ fontSize: '11px', margin: '2px 0', color: 'var(--text-2)' }}>Nº B001-{ticketSeleccionado.id_pago.toString().slice(-6)}</p>
          </div>

          <div style={{ fontSize: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px', lineHeight: '1.4' }}>
            <div><strong>Fecha:</strong> {new Date(ticketSeleccionado.fecha_pago).toLocaleDateString()} {new Date(ticketSeleccionado.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div><strong>Mesa:</strong> Mesa {obtenerNumeroMesa(ticketSeleccionado.id_mesa)}</div>
            <div><strong>Cajero:</strong> SwiftTable Auto</div>
          </div>

          <div style={{ fontSize: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', marginBottom: '4px' }}>
              <span>CANT PRODUCTO</span>
              <span>TOTAL</span>
            </div>
            {ticketSeleccionado.items && ticketSeleccionado.items.length > 0 ? (
              ticketSeleccionado.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>{it.cantidad}x {it.nombre}</span>
                  <span>S/ {(Number(it.precio) * it.cantidad).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>1x Consumo General</span>
                <span>S/ {baseVal.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div style={{ fontSize: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '12px', lineHeight: '1.5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal Platos</span>
              <span>S/ {baseVal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Servicio (10%)</span>
              <span>S/ {servicioVal.toFixed(2)}</span>
            </div>
            {ticketSeleccionado.propina > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Propina</span>
                <span>S/ {Number(ticketSeleccionado.propina).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '14px', marginTop: '6px', color: '#0f172a' }}>
              <span>TOTAL</span>
              <span>S/ {Number(ticketSeleccionado.monto_total).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '16px', lineHeight: '1.4' }}>
            <div><strong>Método de Pago:</strong> {ticketSeleccionado.metodo_pago.toUpperCase()}</div>
            <div style={{ marginTop: '8px', fontStyle: 'italic' }}>¡Gracias por su preferencia!</div>
            <div>Bienes exonerados del I.G.V.</div>
          </div>

          <button
            onClick={() => {
              setTicketModalOpen(false)
              setTicketSeleccionado(null)
            }}
            className="wf-btn-solid"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '13px',
              borderRadius: '8px',
              margin: 0,
              background: 'var(--dark-action)',
              boxShadow: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)'
            }}
          >
            Cerrar Boleta
          </button>
        </div>
      </div>
    )
  }

  const renderHistorial = () => {
    const comandasHistorial = todosPedidos
      .filter(p => p.estado === 'pagado' || p.estado === 'cancelado')
      .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))

    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-1)' }}>
              Historial de Pedidos
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              {comandasHistorial.length} pedidos finalizados
            </p>
          </div>
        </div>

        {comandasHistorial.length === 0 ? (
          <div className="card text-center" style={{ padding: '40px 20px', background: 'var(--surface)' }}>
            <div style={{ color: 'var(--text-3)', marginBottom: '8px' }}>
              <FileText size={32} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-2)' }}>
              No hay pedidos en el historial
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comandasHistorial.map(ped => {
              const isExpanded = ticketSeleccionado?.id_pedido === ped.id_pedido
              const fecha = new Date(ped.fecha_hora)
              const formatFecha = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              const totalItems = ped.items?.reduce((s, i) => s + (i.cantidad || 1), 0) || 0
              const totalPrecio = ped.items?.reduce((s, i) => s + (Number(i.precio || 0) * (i.cantidad || 1)), 0) || 0

              return (
                <div key={ped.id_pedido} className="card animate-pop" style={{ padding: '0', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      padding: '16px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: 'var(--surface)'
                    }}
                    onClick={() => isExpanded ? setTicketSeleccionado(null) : setTicketSeleccionado(ped)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-1)' }}>
                          Mesa {obtenerNumeroMesa(ped.id_mesa)}
                        </span>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontWeight: '700',
                          background: ped.estado === 'pagado' ? 'var(--green-bg)' : 'var(--red-bg)',
                          color: ped.estado === 'pagado' ? 'var(--green)' : 'var(--red)',
                          textTransform: 'uppercase'
                        }}>
                          {ped.estado}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }}/>
                        {formatFecha}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-1)' }}>
                        S/ {totalPrecio.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                        {totalItems} items
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px dashed var(--border-2)', background: 'var(--bg)', padding: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Detalle del Pedido #{ped.id_pedido}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(ped.items || []).map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <div style={{ display: 'flex', gap: '8px', color: 'var(--text-1)' }}>
                              <span style={{ fontWeight: '600' }}>{it.cantidad}x</span>
                              <span>{it.nombre}</span>
                            </div>
                            <span style={{ color: 'var(--text-2)' }}>S/ {(Number(it.precio) * it.cantidad).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderPlatosListosSalon = () => {
    const listos = todosPedidos.filter(p => p.estado === 'listo_para_servir')
    if (listos.length === 0) return null

    return (
      <div className="card animate-pop" style={{ border: '2px solid var(--blue)', padding: '16px', marginBottom: '24px', background: 'var(--blue-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--blue)', animation: 'pulse 1.5s infinite' }}></div>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--blue)' }}>
            ¡Platos Listos en Barra para Entregar! ({listos.length})
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {listos.map(ped => (
            <div key={ped.id_pedido} style={{ background: 'var(--surface)', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-1)' }}>Mesa {obtenerNumeroMesa(ped.id_mesa)}</span>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>
                  {ped.items && ped.items.map(it => `${it.cantidad}x ${it.nombre}`).join(', ')}
                </div>
              </div>
              <button
                onClick={() => cambiarEstadoPedidoClick(ped.id_pedido, 'servido')}
                className="wf-btn-solid"
                style={{
                  background: 'var(--green)',
                  fontSize: '12px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  margin: 0,
                  boxShadow: 'none',
                  cursor: 'pointer'
                }}
              >
                Servir a Mesa
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header Premium */}
      <div className="native-app-bar">
        <div className="left-action">
          <button className="wf-btn-ghost" onClick={() => navigate('/')} style={{ padding: 0 }}>
            <ChevronLeft size={28} color="var(--accent)" />
          </button>
        </div>
        <div className="title">{nombreRestaurante} - Logística</div>
        <div className="right-action" style={{ gap: '12px', width: 'auto', minWidth: '40px' }}>
          <button 
            onClick={() => { iniciarAudio(); setSonidoHabilitado(!sonidoHabilitado); }}
            className="wf-btn-ghost"
            style={{ padding: 0, display: 'flex', alignItems: 'center' }}
            title={sonidoHabilitado ? "Silenciar sonido" : "Activar sonido"}
          >
            {sonidoHabilitado ? <Volume2 size={24} color="var(--accent)" /> : <VolumeX size={24} color="var(--text-3)" />}
          </button>
          <button className="wf-btn-ghost" onClick={() => cargarDatos(true)} style={{ padding: 0 }}>
            <RefreshCw size={22} color="var(--accent)" className={cargando ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="content-wrapper" style={{ padding: '16px' }}>
        
        {/* Selector de Modo de Vista */}
        {renderSelectorModo()}

        {/* Modal de Ticket Electrónico en Caja */}
        {ticketModalOpen && renderTicketModal()}

        {vistaModo === 'cocina' && renderCocinaKDS()}
        
        {vistaModo === 'caja' && renderCajaRegistradora()}

        {vistaModo === 'historial' && renderHistorial()}

        {vistaModo === 'salon' && (
          <>
            {/* Platos listos en barra */}
            {renderPlatosListosSalon()}

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div className="card" style={{ textAlign: 'center', marginBottom: 0, padding: '12px 8px' }}>
                <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Pendientes</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: totalPendientes > 0 ? 'var(--accent)' : 'var(--green)' }}>
                  {totalPendientes}
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center', marginBottom: 0, padding: '12px 8px' }}>
                <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Llamar Mozo</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: totalMozos > 0 ? 'var(--yellow)' : 'var(--text-3)' }}>
                  {totalMozos}
                </div>
              </div>
              <div className="card" style={{ textAlign: 'center', marginBottom: 0, padding: '12px 8px' }}>
                <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Pedir Cuenta</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: totalCuentas > 0 ? 'var(--purple)' : 'var(--text-3)' }}>
                  {totalCuentas}
                </div>
              </div>
            </div>

            {/* MAPA DE MESAS */}
            <div className="section-label" style={{ marginBottom: '10px' }}>
              Estado de Mesas (Salón)
            </div>
            <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
              {mesas.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '14px' }}>Cargando mapa de mesas...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {mesas.map(m => {
                    const esOcupada = m.estado === 'ocupada'
                    const esSeleccionada = mesaSeleccionada?.id_mesa === m.id_mesa
                    const tieneLlamado = asistencias.some(a => a.id_mesa === m.id_mesa && a.estado === 'pendiente')
                    const tieneListo = todosPedidos.some(p => p.id_mesa === m.id_mesa && p.estado === 'listo_para_servir')

                    return (
                      <button
                        key={m.id_mesa}
                        onClick={() => setMesaSeleccionada(m)}
                        style={{
                          aspectRatio: '1',
                          border: esSeleccionada ? '2.5px solid var(--text-1)' : '1px solid var(--border)',
                          borderRadius: '12px',
                          background: tieneLlamado 
                            ? 'var(--accent-bg)' 
                            : (tieneListo ? 'var(--blue-bg)' : (esOcupada ? 'var(--surface-2)' : 'var(--surface)')),
                          color: 'var(--text-1)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: esSeleccionada ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                          transform: esSeleccionada ? 'scale(1.05)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '18px', fontWeight: '800' }}>M{m.numero}</span>
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: '700', 
                          color: tieneLlamado ? 'var(--accent)' : (tieneListo ? 'var(--blue)' : (esOcupada ? 'var(--text-2)' : 'var(--green)'))
                        }}>
                          {tieneLlamado ? 'Llamando' : (tieneListo ? '¡Listo!' : (esOcupada ? 'Ocupada' : 'Libre'))}
                        </span>
                        
                        {/* Indicadores flotantes */}
                        {tieneListo && (
                          <div style={{
                            position: 'absolute', top: '-4px', left: '-4px',
                            background: 'var(--blue)', color: 'white',
                            borderRadius: '50%', width: '18px', height: '18px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'pulse 1.5s infinite'
                          }}>
                            <Bell size={10} style={{ color: 'white' }} />
                          </div>
                        )}
                        {m.comensales && m.comensales.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '-4px', right: '-4px',
                            background: 'var(--dark-action)', color: 'white',
                            borderRadius: '50%', width: '18px', height: '18px',
                            fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                          }}>
                            {m.comensales.length}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* DETALLE DE MESA SELECCIONADA */}
            {mesaSeleccionada && (
              <div className="card animate-pop" style={{ border: '2px solid var(--accent)', padding: '20px', marginBottom: '24px', position: 'relative' }}>
                <button 
                  onClick={() => setMesaSeleccionada(null)}
                  style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-2)'
                  }}
                >
                  <X size={20} />
                </button>

                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-1)' }}>
                  Detalles: Mesa {mesaSeleccionada.numero}
                </h3>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span className={`category-tab active`} style={{ fontSize: '11px', padding: '4px 10px', background: mesaSeleccionada.estado === 'ocupada' ? 'var(--accent)' : 'var(--green)' }}>
                        {mesaSeleccionada.estado === 'ocupada' ? 'Sesión Ocupada' : 'Mesa Vacía / Libre'}
                      </span>
                      <span className="category-tab" style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--surface-2)', color: 'var(--text-1)', boxShadow: 'none' }}>
                        PIN: <strong>{mesaSeleccionada.pin || 'Sin PIN'}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => handlePrintQR(mesaSeleccionada)}
                      className="wf-btn-outline"
                      style={{
                        padding: '10px 14px',
                        fontSize: '13px',
                        fontWeight: '700',
                        borderRadius: '8px',
                        width: '100%',
                        margin: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '1px solid var(--border-2)',
                        boxShadow: 'none'
                      }}
                    >
                      <QrCode size={16} /> Imprimir QR de Mesa
                    </button>
                  </div>
                  <div style={{
                    background: '#fff',
                    padding: '8px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0
                  }}>
                    <img 
                      src={`${API_URL}/mesas/${mesaSeleccionada.id_mesa}/qr_imagen?host=${window.location.origin}`}
                      alt={`QR Mesa ${mesaSeleccionada.numero}`}
                      style={{ width: '80px', height: '80px', display: 'block', borderRadius: '4px' }}
                      key={mesaSeleccionada.token_sesion || 'no-token'}
                    />
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', marginTop: '4px' }}>QR ACTIVO</span>
                  </div>
                </div>

                {/* Comensales conectados */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} /> Comensales en la Mesa
                  </div>
                  {(!mesaSeleccionada.comensales || mesaSeleccionada.comensales.length === 0) ? (
                    <div style={{ fontSize: '14px', color: 'var(--text-3)', fontStyle: 'italic' }}>No hay comensales en esta sesión.</div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {mesaSeleccionada.comensales.map((c, idx) => (
                        <div key={idx} style={{ background: 'var(--surface-2)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                          <User size={12} style={{ color: 'var(--accent)' }} />
                          <span style={{ fontWeight: '600' }}>{c.nombre}</span>
                          {c.isLider && <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 'bold' }}>Líder</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pedidos de la Mesa */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Utensils size={14} /> Consumo y Pedidos Activos
                  </div>
                  {pedidosMesa.length === 0 ? (
                    <div style={{ fontSize: '14px', color: 'var(--text-3)', fontStyle: 'italic' }}>Sin pedidos confirmados todavía.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {pedidosMesa.map((ped) => (
                        <div key={ped.id_pedido} style={{ background: 'var(--bg)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border)' }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-2)', marginBottom: '8px', gap: '8px' }}>
                            <span>Pedido #{ped.id_pedido}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ 
                                fontWeight: 'bold', 
                                color: ped.estado === 'servido' ? 'var(--green)' : (ped.estado === 'listo_para_servir' ? 'var(--blue)' : 'var(--accent)')
                              }}>
                                {ped.estado === 'pendiente' && 'Pendiente'}
                                {ped.estado === 'en_preparacion' && 'En Cocina'}
                                {ped.estado === 'listo_para_servir' && 'Listo en Cocina'}
                                {ped.estado === 'servido' && 'Entregado'}
                              </span>
                              
                              {(ped.estado === 'pendiente' || ped.estado === 'en_preparacion') && (
                                <button
                                  onClick={() => cambiarEstadoPedidoClick(ped.id_pedido, 'listo_para_servir')}
                                  style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Listo
                                </button>
                              )}
                              {ped.estado === 'listo_para_servir' && (
                                <button
                                  onClick={() => cambiarEstadoPedidoClick(ped.id_pedido, 'servido')}
                                  style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Servir
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {ped.items && ped.items.map((it, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span>{it.cantidad}x {it.nombre}</span>
                                <span style={{ fontWeight: '500' }}>S/ {(Number(it.precio) * it.cantidad).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones de Cierre */}
                {(pedidosMesa.length > 0 || mesaSeleccionada.estado === 'ocupada') && (() => {
                  if (pedidosMesa.length === 0) {
                    return (
                      <div style={{ marginTop: '16px', background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px', textAlign: 'center' }}>
                          La mesa está ocupada pero no tiene pedidos registrados.
                        </div>
                        <button
                          onClick={() => handleLiberarMesa(mesaSeleccionada.id_mesa)}
                          className="wf-btn-solid"
                          style={{
                            background: 'var(--red)',
                            boxShadow: 'none',
                            fontSize: '15px',
                            padding: '14px',
                            borderRadius: '12px',
                            width: '100%',
                            margin: 0
                          }}
                        >
                          Cerrar Mesa sin Consumo y Liberar
                        </button>
                      </div>
                    )
                  }

                  const subtotal = pedidosMesa.reduce((acc, ped) => {
                    return acc + ped.items.reduce((s, it) => s + (Number(it.precio) * it.cantidad), 0)
                  }, 0)
                  const servicio = subtotal * 0.10
                  const totalPagar = subtotal + servicio
                  const solicitaCuenta = asistencias.some(a => a.id_mesa === mesaSeleccionada.id_mesa && a.tipo === 'pedir_cuenta' && a.estado === 'pendiente')

                  return (
                    <div style={{ marginTop: '16px', background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Resumen de Cuenta (Caja)
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-2)' }}>Subtotal Platos</span>
                        <span>S/ {subtotal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-2)' }}>Servicio (10%)</span>
                        <span>S/ {servicio.toFixed(2)}</span>
                      </div>
                      <hr style={{ border: 'none', borderTop: '0.5px solid var(--border-2)', margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: 'var(--text-1)', marginBottom: '16px' }}>
                        <span>Total a Cobrar</span>
                        <span>S/ {totalPagar.toFixed(2)}</span>
                      </div>

                      {solicitaCuenta ? (
                        <button
                          onClick={handleRegistrarPagoCerrar}
                          className="wf-btn-solid"
                          style={{
                            background: 'var(--green)',
                            boxShadow: 'none',
                            fontSize: '15px',
                            padding: '14px',
                            borderRadius: '12px',
                            width: '100%',
                            margin: 0
                          }}
                        >
                          Registrar Pago en Caja y Cerrar Mesa
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLiberarMesa(mesaSeleccionada.id_mesa)}
                          className="wf-btn-solid"
                          style={{
                            background: 'var(--red)',
                            boxShadow: 'none',
                            fontSize: '15px',
                            padding: '14px',
                            borderRadius: '12px',
                            width: '100%',
                            margin: 0
                          }}
                        >
                          Cerrar Cuenta y Liberar Mesa
                        </button>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Filtros de Alertas */}
            <div className="section-label" style={{ marginBottom: '10px' }}>Alertas y Llamados Pendientes</div>
            <div className="category-tabs" style={{ margin: '0 -16px 20px', padding: '0 16px' }}>
              {[
                { id: 'pendientes', label: 'Pendientes' },
                { id: 'mozo', label: 'Solo Mozo' },
                { id: 'cuenta', label: 'Solo Cuenta' },
                { id: 'atendidos', label: 'Atendidos' },
                { id: 'todos', label: 'Todos' }
              ].map(f => (
                <div
                  key={f.id}
                  className={`category-tab ${filtro === f.id ? 'active' : ''}`}
                  onClick={() => setFiltro(f.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {f.label}
                </div>
              ))}
            </div>

            {/* Sandbox de Simulación (Solo en Salón) */}
            {vistaModo === 'salon' && (
              <div className="card" style={{ border: '1.5px dashed var(--border-2)', padding: '16px', marginBottom: '24px', background: 'var(--surface)' }}>
                <div className="section-label" style={{ color: 'var(--yellow)', fontWeight: '800', fontSize: '12px', marginBottom: '12px' }}>
                  Sandbox de Simulación
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-2)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Mesa</label>
                    <select 
                      value={mesaSimulada} 
                      onChange={(e) => setMesaSimulada(e.target.value)}
                      style={{
                        width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                        color: 'var(--text-1)', padding: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit'
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>Mesa {n}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-2)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Tipo</label>
                    <select 
                      value={tipoSimulado} 
                      onChange={(e) => setTipoSimulado(e.target.value)}
                      style={{
                        width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                        color: 'var(--text-1)', padding: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit'
                      }}
                    >
                      <option value="llamar_mesero">Llamado General</option>
                      <option value="pedir_cuenta">Pedir la Cuenta</option>
                      <option value="traer_cubiertos">Pedir Cubiertos</option>
                      <option value="traer_servilletas">Pedir Servilletas</option>
                      <option value="traer_hielo">Pedir Hielo</option>
                      <option value="retirar_platos">Retirar Platos sucios</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSimular}
                  className="wf-btn-outline"
                  style={{
                    padding: '12px', fontSize: '14px', borderRadius: 'var(--r-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Plus size={16} /> Emitir Llamado Simulado
                </button>
              </div>
            )}

            {/* List of Calls */}
            <div>
              <div className="section-label" style={{ marginBottom: '12px' }}>
                Alertas Activas ({asistenciasFiltradas.length})
              </div>

              {cargando && asistencias.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>Cargando llamados...</div>
              ) : asistenciasFiltradas.length === 0 ? (
                <div className="card text-center" style={{ padding: '32px 16px', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={28} />
                    </div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>Sin llamados en este filtro</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>¡Todo al día!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {asistenciasFiltradas.map((asist) => {
                    const esPendiente = asist.estado === 'pendiente'
                    
                    const obtenerInfoAsistencia = (tipo) => {
                      if (tipo === 'llamar_mesero') return { label: 'Llamada al Mozo', icon: Bell, color: 'var(--yellow)', bg: 'var(--yellow-bg)', border: 'rgba(245, 158, 11, 0.2)' }
                      if (tipo === 'pedir_cuenta') return { label: 'Solicita Cuenta', icon: DollarSign, color: 'var(--purple)', bg: 'var(--purple-bg)', border: 'rgba(168, 85, 247, 0.2)' }
                      if (tipo === 'traer_cubiertos') return { label: 'Pide Cubiertos', icon: Utensils, color: 'var(--accent)', bg: 'var(--accent-bg)', border: 'rgba(225, 77, 42, 0.2)' }
                      if (tipo === 'traer_servilletas') return { label: 'Pide Servilletas', icon: FileText, color: '#0ea5e9', bg: '#f0f9ff', border: 'rgba(14, 165, 233, 0.2)' }
                      if (tipo === 'traer_hielo') return { label: 'Pide Hielo', icon: RefreshCw, color: '#06b6d4', bg: '#ecfeff', border: 'rgba(6, 182, 212, 0.2)' }
                      if (tipo === 'retirar_platos') return { label: 'Limpiar Mesa', icon: Utensils, color: '#14b8a6', bg: '#f0fdfa', border: 'rgba(20, 184, 166, 0.2)' }
                      return { label: 'Asistencia', icon: Bell, color: 'var(--accent)', bg: 'var(--accent-bg)', border: 'rgba(225, 77, 42, 0.2)' }
                    }
                    const info = obtenerInfoAsistencia(asist.tipo)

                    return (
                      <div 
                        key={asist.id_asistencia}
                        className="card animate-pop"
                        style={{
                          margin: 0,
                          borderLeft: `5px solid ${esPendiente ? info.color : 'var(--border-2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                          padding: '16px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            background: esPendiente ? info.bg : 'var(--surface-2)',
                            color: esPendiente ? info.color : 'var(--text-2)',
                            width: '56px', height: '56px', borderRadius: '12px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            border: `1px solid ${esPendiente ? info.border : 'var(--border)'}`
                          }}>
                            <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.8 }}>Mesa</span>
                            <span style={{ fontSize: '20px', fontWeight: '800' }}>{obtenerNumeroMesa(asist.id_mesa)}</span>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-1)', display: 'inline-flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
                                  {React.createElement(info.icon, { size: 15 })}
                                </span>
                                <span>{info.label}</span>
                              </span>
                              {esPendiente ? (
                                <span style={{
                                  width: '8px', height: '8px', borderRadius: '50%',
                                  backgroundColor: info.color,
                                  display: 'inline-block',
                                  boxShadow: `0 0 8px ${info.color}`,
                                  animation: 'pulse 1.5s infinite'
                                }} />
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: '600' }}>Atendido</span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
                              <Clock size={13} />
                              <span>{obtenerTiempoTranscurrido(asist.fecha_hora)}</span>
                            </div>
                          </div>
                        </div>

                        {esPendiente && (
                          <button
                            onClick={() => handleAtender(asist.id_asistencia)}
                            className="wf-btn-solid"
                            style={{
                              background: 'var(--green)', color: 'white', border: 'none',
                              borderRadius: 'var(--r-full)', padding: '10px 18px', fontWeight: '600',
                              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                              transition: 'all 0.2s',
                              width: 'auto',
                              margin: 0
                            }}
                          >
                            Atender
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {confirmModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '24px'
        }}>
          <div className="card animate-pop" style={{ maxWidth: '400px', width: '100%', padding: '24px', margin: 0, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-1)' }}>
              Confirmar Liberación
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.5', marginBottom: '24px' }}>
              ¿Estás seguro de que deseas cerrar la sesión y liberar la <strong>Mesa {obtenerNumeroMesa(mesaALiberar)}</strong>? Esto borrará los comensales actuales.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="wf-btn-outline" 
                style={{ flex: 1, padding: '12px', fontSize: '14px', borderRadius: '12px' }}
                onClick={() => { setConfirmModalOpen(false); setMesaALiberar(null); }}
              >
                Cancelar
              </button>
              <button 
                className="wf-btn-solid" 
                style={{ flex: 1, padding: '12px', fontSize: '14px', borderRadius: '12px', background: 'var(--accent)', margin: 0, boxShadow: 'none' }}
                onClick={confirmarLiberarMesa}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
      `}</style>
    </>
  )
}
