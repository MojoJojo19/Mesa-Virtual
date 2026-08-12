import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, FileText, ChevronLeft, RefreshCw, CheckCircle, Clock, Plus, Volume2, VolumeX,
  X, Users, Utensils, ChefHat, ConciergeBell, Receipt, DollarSign, Snowflake, Sparkles, BarChart3
} from 'lucide-react'
import {
  getAsistencias, atenderAsistencia, simularLlamadoDesdePanel, getMesas, liberarMesa,
  getPedidosDeMesa, registrarPago, actualizarEstadoPedido, getPagos, getPedidosTodos
} from '../services/api'
import { useToast } from '../components/Toast'
import { colorComensal, inicial } from '../theme/sala'
import Metricas from './Metricas'

const MODOS = [
  { id: 'salon',  label: 'Salón',  icono: ConciergeBell },
  { id: 'cocina', label: 'Cocina', icono: ChefHat },
  { id: 'caja',   label: 'Caja',   icono: Receipt },
  { id: 'metricas', label: 'Métricas', icono: BarChart3 }
]

const FILTROS = [
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'mozo',       label: 'Solo mozo' },
  { id: 'cuenta',     label: 'Solo cuenta' },
  { id: 'atendidos',  label: 'Atendidos' },
  { id: 'todos',      label: 'Todos' }
]

/* Cada tipo de llamado con su color e icono, en una sola familia visual. */
const TIPOS_ASISTENCIA = {
  llamar_mesero:     { label: 'Llama al mozo',   icono: Bell,       color: 'var(--st-amber)' },
  pedir_cuenta:      { label: 'Pide la cuenta',  icono: DollarSign, color: 'var(--st-violet)' },
  traer_cubiertos:   { label: 'Pide cubiertos',  icono: Utensils,   color: 'var(--st-accent)' },
  traer_servilletas: { label: 'Pide servilletas',icono: FileText,   color: 'var(--st-cyan)' },
  traer_hielo:       { label: 'Pide hielo',      icono: Snowflake,  color: 'var(--st-mint)' },
  retirar_platos:    { label: 'Limpiar mesa',    icono: Sparkles,   color: 'var(--st-pink)' }
}

const infoAsistencia = (tipo) => TIPOS_ASISTENCIA[tipo] || { label: 'Asistencia', icono: Bell, color: 'var(--st-accent)' }

const ESTADO_PEDIDO = {
  pendiente:        { label: 'Pendiente',  color: 'var(--st-amber)' },
  en_preparacion:   { label: 'En cocina',  color: 'var(--st-amber)' },
  listo_para_servir:{ label: 'Listo',      color: 'var(--st-cyan)' },
  servido:          { label: 'Entregado',  color: 'var(--st-lime)' }
}

export default function Logistica() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [asistencias, setAsistencias] = useState([])
  const [mesas, setMesas] = useState([])
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [pedidosMesa, setPedidosMesa] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('pendientes')
  const [mesaSimulada, setMesaSimulada] = useState(3)
  const [tipoSimulado, setTipoSimulado] = useState('llamar_mesero')
  const [tick, setTick] = useState(0)
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [mesaALiberar, setMesaALiberar] = useState(null)

  const [vistaModo, setVistaModo] = useState('salon')
  const [pagos, setPagos] = useState([])
  const [todosPedidos, setTodosPedidos] = useState([])
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null)

  const asistenciasPrevias = useRef(new Set())

  const idRestaurante = parseInt(localStorage.getItem('swifttable_id_restaurante')) || null
  const nombreRestaurante = localStorage.getItem('swifttable_nombre_restaurante') || 'SwiftTable'

  // Sintetizador Web Audio: sonido limpio sin depender de archivos externos.
  const reproducirSonidoAlerta = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()

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
      playNote(now, 587.33, 0.3)
      playNote(now + 0.12, 880, 0.45)
    } catch (e) {
      console.warn('Sonido bloqueado por restricciones del navegador:', e)
    }
  }

  const cargarDatos = async (mostrarToast = false) => {
    try {
      const restId = idRestaurante
      const [datosAsist, datosMesas, datosPagos, datosPedidos] = await Promise.all([
        getAsistencias(restId),
        getMesas(restId),
        getPagos(restId),
        getPedidosTodos(restId)
      ])

      const ordenados = (datosAsist || []).sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
      const pendientesActuales = (datosAsist || []).filter(a => a.estado === 'pendiente')
      if (asistenciasPrevias.current.size > 0 && sonidoHabilitado) {
        const hayNuevas = pendientesActuales.some(a => !asistenciasPrevias.current.has(a.id_asistencia))
        if (hayNuevas) reproducirSonidoAlerta()
      }
      asistenciasPrevias.current = new Set(pendientesActuales.map(a => a.id_asistencia))
      setAsistencias(ordenados)

      setMesas(datosMesas || [])
      setPagos(datosPagos || [])
      setTodosPedidos(datosPedidos || [])

      if (mesaSeleccionada) {
        const actualizada = (datosMesas || []).find(m => m.id_mesa === mesaSeleccionada.id_mesa)
        if (actualizada) setMesaSeleccionada(actualizada)
      }

      if (mostrarToast) toast('Datos actualizados', 'success')
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    const interval = setInterval(() => cargarDatos(), 5000)
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => { clearInterval(interval); clearInterval(timer) }
  }, [])

  useEffect(() => {
    if (mesaSeleccionada) {
      const fetchPedidos = async () => {
        try {
          const peds = await getPedidosDeMesa(mesaSeleccionada.id_mesa)
          setPedidosMesa(peds || [])
        } catch (e) {
          console.error(e)
        }
      }
      fetchPedidos()
    } else {
      setPedidosMesa([])
    }
  }, [mesaSeleccionada?.id_mesa, tick])

  const handleAtender = async (id) => {
    try {
      await atenderAsistencia(id)
      toast('Llamado marcado como atendido', 'success')
      setAsistencias(prev => prev.map(a => a.id_asistencia === id ? { ...a, estado: 'atendido' } : a))
    } catch (e) {
      toast('Error al actualizar estado', 'error')
    }
  }

  const handleLiberarMesa = (idMesa) => {
    setMesaALiberar(idMesa)
    setConfirmModalOpen(true)
  }

  const confirmarLiberarMesa = async () => {
    if (!mesaALiberar) return
    setConfirmModalOpen(false)
    try {
      const mesaLiberada = await liberarMesa(mesaALiberar)
      toast(`Mesa ${mesaALiberar} liberada. PIN reiniciado.`, 'success')
      setMesas(prev => prev.map(m => m.id_mesa === mesaALiberar ? mesaLiberada : m))
      setMesaSeleccionada(null)
      setMesaALiberar(null)
      cargarDatos()
    } catch (e) {
      toast('Error al liberar la mesa', 'error')
    }
  }

  const cambiarEstadoPedidoClick = async (idPedido, nuevoEstado) => {
    try {
      await actualizarEstadoPedido(idPedido, nuevoEstado)
      toast(`Pedido ${nuevoEstado === 'listo_para_servir' ? 'listo en barra' : 'entregado'}`, 'success')
      if (mesaSeleccionada) {
        const peds = await getPedidosDeMesa(mesaSeleccionada.id_mesa)
        setPedidosMesa(peds || [])
      }
      cargarDatos()
    } catch (e) {
      toast('Error al actualizar el pedido', 'error')
    }
  }

  const handleRegistrarPagoCerrar = async () => {
    if (!mesaSeleccionada) return
    const subtotal = pedidosMesa.reduce((acc, ped) =>
      acc + ped.items.reduce((s, it) => s + (Number(it.precio) * it.cantidad), 0), 0)
    const totalPagar = subtotal * 1.10

    try {
      const primerPedido = pedidosMesa[0]
      if (primerPedido) await registrarPago(primerPedido.id_pedido, totalPagar, 0, 'efectivo')

      const mesaLiberada = await liberarMesa(mesaSeleccionada.id_mesa)
      toast(`Pago de S/ ${totalPagar.toFixed(2)} registrado. Mesa ${mesaSeleccionada.numero} liberada.`, 'success')

      setMesas(prev => prev.map(m => m.id_mesa === mesaSeleccionada.id_mesa ? mesaLiberada : m))
      setMesaSeleccionada(null)
      cargarDatos()
    } catch (e) {
      toast('Error al registrar el pago', 'error')
    }
  }

  const handleSimular = () => {
    simularLlamadoDesdePanel(mesaSimulada, tipoSimulado)
    toast(`Llamado simulado en Mesa ${mesaSimulada}`, 'info')

    setMesas(prev => prev.map(m => {
      if (m.id_mesa === parseInt(mesaSimulada) && m.estado === 'libre') {
        return { ...m, estado: 'ocupada', comensales: [{ nombre: 'Simulado', avatar: '' }] }
      }
      return m
    }))

    if (sonidoHabilitado) reproducirSonidoAlerta()
    cargarDatos()
  }

  const obtenerTiempoTranscurrido = (fechaStr) => {
    const diffSec = Math.floor((new Date() - new Date(fechaStr)) / 1000)
    if (diffSec < 0) return 'Ahora mismo'
    if (diffSec < 60) return `Hace ${diffSec}s`
    return `Hace ${Math.floor(diffSec / 60)}m ${diffSec % 60}s`
  }

  const asistenciasFiltradas = asistencias.filter(a => {
    if (filtro === 'pendientes') return a.estado === 'pendiente'
    if (filtro === 'atendidos') return a.estado === 'atendido'
    if (filtro === 'mozo') return a.tipo === 'llamar_mesero' && a.estado === 'pendiente'
    if (filtro === 'cuenta') return a.tipo === 'pedir_cuenta' && a.estado === 'pendiente'
    return true
  })

  const totalPendientes = asistencias.filter(a => a.estado === 'pendiente').length
  const totalMozos = asistencias.filter(a => a.tipo === 'llamar_mesero' && a.estado === 'pendiente').length
  const totalCuentas = asistencias.filter(a => a.tipo === 'pedir_cuenta' && a.estado === 'pendiente').length
  const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada').length

  const listosEnBarra = todosPedidos.filter(p => p.estado === 'listo_para_servir')
  const comandasCocina = todosPedidos.filter(p => p.estado === 'pendiente' || p.estado === 'en_preparacion')

  /* ---------------------------------------------------------------- */

  const renderSalon = () => (
    <>
      {listosEnBarra.length > 0 && (
        <div className="st-block st-pop" style={{ borderColor: 'var(--st-cyan)' }}>
          <div className="st-block__head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span className="st-dot" style={{ background: 'var(--st-cyan)' }} />
              <h2 className="st-h2" style={{ fontSize: 20, color: 'var(--st-cyan)' }}>
                Listos en barra para entregar ({listosEnBarra.length})
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {listosEnBarra.map(ped => (
              <div
                key={ped.id_pedido}
                style={{
                  background: 'var(--st-surface)', borderRadius: 'var(--st-r-sm)', padding: 12,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap'
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 17 }}>Mesa {ped.id_mesa}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--st-text-2)', marginTop: 2 }}>
                    {(ped.items || []).map(it => `${it.cantidad}× ${it.nombre}`).join(', ')}
                  </div>
                </div>
                <button className="st-act st-act--go" onClick={() => cambiarEstadoPedidoClick(ped.id_pedido, 'servido')}>
                  Servir a la mesa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="st-stats">
        <div className="st-stat" style={{ borderTopColor: totalPendientes > 0 ? 'var(--st-accent)' : 'var(--st-lime)' }}>
          <span className="st-label">Llamados pendientes</span>
          <span className="st-stat__n" style={{ color: totalPendientes > 0 ? 'var(--st-accent)' : 'var(--st-lime)' }}>
            {totalPendientes}
          </span>
        </div>
        <div className="st-stat" style={{ borderTopColor: 'var(--st-amber)' }}>
          <span className="st-label">Llaman al mozo</span>
          <span className="st-stat__n" style={{ color: totalMozos > 0 ? 'var(--st-amber)' : 'var(--st-text-3)' }}>
            {totalMozos}
          </span>
        </div>
        <div className="st-stat" style={{ borderTopColor: 'var(--st-violet)' }}>
          <span className="st-label">Piden la cuenta</span>
          <span className="st-stat__n" style={{ color: totalCuentas > 0 ? '#c9b4ff' : 'var(--st-text-3)' }}>
            {totalCuentas}
          </span>
        </div>
        <div className="st-stat" style={{ borderTopColor: 'var(--st-cyan)' }}>
          <span className="st-label">Mesas ocupadas</span>
          <span className="st-stat__n" style={{ color: 'var(--st-cyan)' }}>
            {mesasOcupadas}<span style={{ fontSize: 18, color: 'var(--st-text-3)' }}>/{mesas.length}</span>
          </span>
        </div>
      </div>

      <div className="st-cols">
        <div className="st-block">
          <div className="st-block__head">
            <h2 className="st-h2" style={{ fontSize: 20 }}>Mapa del salón</h2>
            <span className="st-label">Toca una mesa para ver su detalle</span>
          </div>

          {mesas.length === 0 ? (
            <div className="st-empty">Cargando el mapa de mesas…</div>
          ) : (
            <div className="st-tables">
              {mesas.map(m => {
                const ocupada = m.estado === 'ocupada'
                const seleccionada = mesaSeleccionada?.id_mesa === m.id_mesa
                const llamando = asistencias.some(a => a.id_mesa === m.id_mesa && a.estado === 'pendiente')
                const listo = todosPedidos.some(p => p.id_mesa === m.id_mesa && p.estado === 'listo_para_servir')

                const variante = llamando ? 'llamando' : listo ? 'listo' : ocupada ? 'ocupada' : 'libre'
                const textoEstado = llamando ? 'Llamando' : listo ? 'Listo' : ocupada ? 'Ocupada' : 'Libre'
                const colorEstado = llamando
                  ? 'var(--st-accent)'
                  : listo ? 'var(--st-cyan)' : ocupada ? 'var(--st-text-2)' : 'var(--st-lime)'

                return (
                  <button
                    key={m.id_mesa}
                    onClick={() => setMesaSeleccionada(m)}
                    className={`st-mesa st-mesa--${variante} ${seleccionada ? 'st-mesa--sel' : ''}`}
                    aria-label={`Mesa ${m.numero}, ${textoEstado}`}
                  >
                    <span className="st-mesa__n">M{m.numero}</span>
                    <span className="st-mesa__estado" style={{ color: colorEstado }}>{textoEstado}</span>

                    {listo && (
                      <span className="st-mesa__badge" style={{ left: -7, background: 'var(--st-cyan)', color: 'var(--st-ink)' }}>
                        <Bell size={11} strokeWidth={2.8} />
                      </span>
                    )}
                    {m.comensales && m.comensales.length > 0 && (
                      <span className="st-mesa__badge" style={{ right: -7, background: 'var(--st-lime)', color: 'var(--st-ink)' }}>
                        {m.comensales.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="st-block">
          <div className="st-block__head">
            <h2 className="st-h2" style={{ fontSize: 20 }}>Alertas ({asistenciasFiltradas.length})</h2>
          </div>

          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {FILTROS.map(f => (
              <button
                key={f.id}
                className={`st-cat ${filtro === f.id ? 'st-cat--on' : ''}`}
                style={{ fontSize: 12.5, padding: '7px 13px' }}
                onClick={() => setFiltro(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {cargando && asistencias.length === 0 ? (
            <div className="st-empty">Cargando llamados…</div>
          ) : asistenciasFiltradas.length === 0 ? (
            <div className="st-empty" style={{ padding: '32px 20px' }}>
              <CheckCircle size={34} strokeWidth={2} color="var(--st-lime)" />
              <div style={{ marginTop: 10, fontWeight: 700, color: 'var(--st-text-1)' }}>Sin llamados aquí</div>
              <div style={{ marginTop: 2 }}>¡Todo al día!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {asistenciasFiltradas.map(asist => {
                const pendiente = asist.estado === 'pendiente'
                const info = infoAsistencia(asist.tipo)
                const Icono = info.icono

                return (
                  <div
                    key={asist.id_asistencia}
                    className="st-alerta st-pop"
                    style={{ borderLeftColor: pendiente ? info.color : 'var(--st-border-2)' }}
                  >
                    <div
                      className="st-alerta__mesa"
                      style={{
                        background: pendiente ? info.color : 'var(--st-surface-2)',
                        color: pendiente ? 'var(--st-ink)' : 'var(--st-text-3)'
                      }}
                    >
                      <small>MESA</small>
                      <b>{asist.id_mesa}</b>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Icono size={15} strokeWidth={2.4} color={pendiente ? info.color : 'var(--st-text-3)'} />
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{info.label}</span>
                        {pendiente
                          ? <span className="st-dot" style={{ background: info.color }} />
                          : <span style={{ fontSize: 11, color: 'var(--st-lime)', fontWeight: 700 }}>ATENDIDO</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12.5, color: 'var(--st-text-3)' }}>
                        <Clock size={13} />
                        <span>{obtenerTiempoTranscurrido(asist.fecha_hora)}</span>
                      </div>
                    </div>

                    {pendiente && (
                      <button className="st-act st-act--go st-act--sm" onClick={() => handleAtender(asist.id_asistencia)}>
                        Atender
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="st-block" style={{ borderStyle: 'dashed' }}>
        <div className="st-block__head">
          <h2 className="st-h2" style={{ fontSize: 18, color: 'var(--st-amber)' }}>Sandbox de simulación</h2>
          <span className="st-label">Para probar el panel sin comensales reales</span>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ flex: '1 1 130px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span className="st-label">Mesa</span>
            <select className="st-field" value={mesaSimulada} onChange={e => setMesaSimulada(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>Mesa {n}</option>)}
            </select>
          </label>

          <label style={{ flex: '2 1 220px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span className="st-label">Tipo de llamado</span>
            <select className="st-field" value={tipoSimulado} onChange={e => setTipoSimulado(e.target.value)}>
              <option value="llamar_mesero">Llamado general</option>
              <option value="pedir_cuenta">Pedir la cuenta</option>
              <option value="traer_cubiertos">Pedir cubiertos</option>
              <option value="traer_servilletas">Pedir servilletas</option>
              <option value="traer_hielo">Pedir hielo</option>
              <option value="retirar_platos">Retirar platos sucios</option>
            </select>
          </label>

          <button className="st-act st-act--quiet" onClick={handleSimular} style={{ flex: '0 0 auto' }}>
            <Plus size={16} /> Emitir llamado
          </button>
        </div>
      </div>
    </>
  )

  const renderCocina = () => (
    <div className="st-block">
      <div className="st-block__head">
        <h2 className="st-h2" style={{ fontSize: 22 }}>Pantalla de cocina</h2>
        <span className="st-chip" style={{ background: 'var(--st-amber)', color: 'var(--st-ink)' }}>
          {comandasCocina.length} {comandasCocina.length === 1 ? 'COMANDA' : 'COMANDAS'} EN ESPERA
        </span>
      </div>

      {comandasCocina.length === 0 ? (
        <div className="st-empty" style={{ padding: '56px 20px' }}>
          <CheckCircle size={40} strokeWidth={2} color="var(--st-lime)" />
          <div style={{ marginTop: 12, fontSize: 17, fontWeight: 700, color: 'var(--st-text-1)' }}>¡Cocina al día!</div>
          <div style={{ marginTop: 4 }}>No hay comandas pendientes de preparación.</div>
        </div>
      ) : (
        <div className="st-comandas">
          {comandasCocina.map(com => {
            // Más de 15 minutos en cocina: la comanda se marca en rojo.
            const minutos = Math.floor((new Date() - new Date(com.fecha_hora)) / 60000)
            return (
              <div key={com.id_pedido} className={`st-comanda st-pop ${minutos >= 15 ? 'st-comanda--vieja' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 22 }}>
                      Mesa {com.id_mesa}
                    </div>
                    <div className="st-label" style={{ marginTop: 2 }}>
                      #{com.id_pedido} · {obtenerTiempoTranscurrido(com.fecha_hora)}
                    </div>
                  </div>
                  <span
                    className="st-chip"
                    style={{
                      background: minutos >= 15 ? 'var(--st-accent)' : 'rgba(255,192,46,0.18)',
                      color: minutos >= 15 ? '#fff' : 'var(--st-amber)',
                      alignSelf: 'flex-start'
                    }}
                  >
                    {com.estado === 'pendiente' ? 'PENDIENTE' : 'PREPARANDO'}
                  </span>
                </div>

                <div className="st-comanda__items">
                  {(com.items || []).map((it, idx) => (
                    <div key={idx} className="st-comanda__item">
                      <b>{it.cantidad}×</b>
                      <span>{it.nombre}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="st-act st-act--go"
                  style={{ width: '100%', padding: 13 }}
                  onClick={() => cambiarEstadoPedidoClick(com.id_pedido, 'listo_para_servir')}
                >
                  <CheckCircle size={16} /> ¡Listo en barra!
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderCaja = () => {
    const totalVentas = pagos.reduce((acc, p) => acc + Number(p.monto_total || 0), 0)
    const totalPropinas = pagos.reduce((acc, p) => acc + Number(p.propina || 0), 0)
    const porMetodo = (...metodos) =>
      pagos.filter(p => metodos.includes(p.metodo_pago)).reduce((acc, p) => acc + Number(p.monto_total || 0), 0)

    return (
      <>
        <div className="st-stats">
          <div className="st-stat" style={{ borderTopColor: 'var(--st-lime)' }}>
            <span className="st-label">Ventas del día</span>
            <span className="st-stat__n" style={{ color: 'var(--st-lime)' }}>S/ {totalVentas.toFixed(2)}</span>
          </div>
          <div className="st-stat" style={{ borderTopColor: 'var(--st-violet)' }}>
            <span className="st-label">Propinas</span>
            <span className="st-stat__n" style={{ color: '#c9b4ff' }}>S/ {totalPropinas.toFixed(2)}</span>
          </div>
          <div className="st-stat" style={{ borderTopColor: 'var(--st-accent)' }}>
            <span className="st-label">Efectivo</span>
            <span className="st-stat__n">S/ {porMetodo('efectivo').toFixed(2)}</span>
          </div>
          <div className="st-stat" style={{ borderTopColor: 'var(--st-cyan)' }}>
            <span className="st-label">Tarjeta</span>
            <span className="st-stat__n">S/ {porMetodo('tarjeta').toFixed(2)}</span>
          </div>
          <div className="st-stat" style={{ borderTopColor: 'var(--st-amber)' }}>
            <span className="st-label">Yape / Plin</span>
            <span className="st-stat__n">S/ {porMetodo('yape', 'plin').toFixed(2)}</span>
          </div>
        </div>

        <div className="st-block" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="st-block__head" style={{ padding: '16px 18px', borderBottom: '2px solid var(--st-border)' }}>
            <h2 className="st-h2" style={{ fontSize: 20 }}>Historial de boletas ({pagos.length})</h2>
          </div>

          {pagos.length === 0 ? (
            <div className="st-empty">No hay pagos registrados hoy.</div>
          ) : (
            <div>
              {pagos.map(p => (
                <div key={p.id_pago} className="st-pago">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 17 }}>
                      Mesa {p.id_mesa}
                    </span>
                    <span className="st-label">
                      Pago #{p.id_pago} · {new Date(p.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div className="st-num" style={{ fontSize: 18, color: 'var(--st-lime)' }}>
                        S/ {Number(p.monto_total).toFixed(2)}
                      </div>
                      <div className="st-label">
                        {String(p.metodo_pago).toUpperCase()}
                        {p.propina > 0 && ` · PROP. S/ ${Number(p.propina).toFixed(2)}`}
                      </div>
                    </div>
                    <button className="st-act st-act--quiet st-act--sm" onClick={() => setTicketSeleccionado(p)}>
                      Ver boleta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    )
  }

  /* ---------------------------------------------------------------- */

  const renderDetalleMesa = () => {
    if (!mesaSeleccionada) return null

    const subtotal = pedidosMesa.reduce((acc, ped) =>
      acc + (ped.items || []).reduce((s, it) => s + (Number(it.precio) * it.cantidad), 0), 0)
    const servicio = subtotal * 0.10
    const totalPagar = subtotal + servicio
    const solicitaCuenta = asistencias.some(
      a => a.id_mesa === mesaSeleccionada.id_mesa && a.tipo === 'pedir_cuenta' && a.estado === 'pendiente'
    )

    return (
      <div className="st-modal-backdrop" onClick={() => setMesaSeleccionada(null)} role="dialog" aria-modal="true">
        <div className="st-modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
          <div className="st-block__head">
            <div>
              <h2 className="st-h2" style={{ fontSize: 26 }}>Mesa {mesaSeleccionada.numero}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span
                  className="st-chip"
                  style={{
                    background: mesaSeleccionada.estado === 'ocupada' ? 'var(--st-accent)' : 'var(--st-lime)',
                    color: mesaSeleccionada.estado === 'ocupada' ? '#fff' : 'var(--st-ink)'
                  }}
                >
                  {mesaSeleccionada.estado === 'ocupada' ? 'SESIÓN ACTIVA' : 'MESA LIBRE'}
                </span>
                {mesaSeleccionada.pin && (
                  <span className="st-chip" style={{ background: 'var(--st-surface)', color: 'var(--st-text-1)' }}>
                    PIN {mesaSeleccionada.pin}
                  </span>
                )}
              </div>
            </div>
            <button className="st-back" onClick={() => setMesaSeleccionada(null)} aria-label="Cerrar">
              <X size={19} strokeWidth={2.4} />
            </button>
          </div>

          <div>
            <div className="st-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
              <Users size={13} /> Comensales en la mesa
            </div>
            {(!mesaSeleccionada.comensales || mesaSeleccionada.comensales.length === 0) ? (
              <p style={{ fontSize: 14, color: 'var(--st-text-3)' }}>No hay comensales en esta sesión.</p>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {mesaSeleccionada.comensales.map((c, idx) => {
                  const color = colorComensal(c.avatar, c.nombre)
                  return (
                    <span
                      key={idx}
                      style={{
                        background: 'var(--st-surface)', borderRadius: 999, padding: '5px 12px 5px 5px',
                        display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600
                      }}
                    >
                      <span
                        className="st-tile"
                        style={{ width: 26, height: 26, borderRadius: 9, background: color.hex, color: color.fg, fontSize: 13 }}
                      >
                        {inicial(c.nombre)}
                      </span>
                      {c.nombre}
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <div className="st-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
              <Utensils size={13} /> Pedidos activos
            </div>
            {pedidosMesa.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--st-text-3)' }}>Sin pedidos confirmados todavía.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {pedidosMesa.map(ped => {
                  const est = ESTADO_PEDIDO[ped.estado] || { label: ped.estado, color: 'var(--st-text-3)' }
                  return (
                    <div
                      key={ped.id_pedido}
                      style={{ background: 'var(--st-surface)', borderRadius: 'var(--st-r-sm)', padding: 12 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className="st-label">Pedido #{ped.id_pedido}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 12.5, color: est.color }}>{est.label}</span>
                          {(ped.estado === 'pendiente' || ped.estado === 'en_preparacion') && (
                            <button
                              className="st-act st-act--warn st-act--sm"
                              onClick={() => cambiarEstadoPedidoClick(ped.id_pedido, 'listo_para_servir')}
                            >
                              Marcar listo
                            </button>
                          )}
                          {ped.estado === 'listo_para_servir' && (
                            <button
                              className="st-act st-act--go st-act--sm"
                              onClick={() => cambiarEstadoPedidoClick(ped.id_pedido, 'servido')}
                            >
                              Servir
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(ped.items || []).map((it, idx) => (
                          <div key={idx} className="st-order__line">
                            <span>{it.cantidad}× {it.nombre}</span>
                            <span>S/ {(Number(it.precio) * it.cantidad).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {pedidosMesa.length > 0 && (
            <div style={{ background: 'var(--st-surface)', borderRadius: 'var(--st-r-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div className="st-label">Resumen de cuenta</div>
              <div className="st-order__line"><span>Subtotal platos</span><span>S/ {subtotal.toFixed(2)}</span></div>
              <div className="st-order__line"><span>Servicio (10%)</span><span>S/ {servicio.toFixed(2)}</span></div>
              <div style={{ height: 2, background: 'var(--st-border)', borderRadius: 2, margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 18 }}>Total a cobrar</span>
                <span className="st-num" style={{ fontSize: 24, color: 'var(--st-lime)' }}>S/ {totalPagar.toFixed(2)}</span>
              </div>

              {solicitaCuenta ? (
                <button className="st-act st-act--go" style={{ marginTop: 8, padding: 14 }} onClick={handleRegistrarPagoCerrar}>
                  Cobrar S/ {totalPagar.toFixed(2)} y cerrar mesa
                </button>
              ) : (
                <button
                  className="st-act st-act--danger"
                  style={{ marginTop: 8, padding: 14 }}
                  onClick={() => handleLiberarMesa(mesaSeleccionada.id_mesa)}
                >
                  Cerrar cuenta y liberar mesa
                </button>
              )}
            </div>
          )}

          {pedidosMesa.length === 0 && mesaSeleccionada.estado === 'ocupada' && (
            <button className="st-act st-act--danger" style={{ padding: 14 }} onClick={() => handleLiberarMesa(mesaSeleccionada.id_mesa)}>
              Liberar mesa (reinicia el PIN)
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderBoleta = () => {
    if (!ticketSeleccionado) return null
    const subtotal = Number(ticketSeleccionado.monto_total || 0) - Number(ticketSeleccionado.propina || 0)
    const baseVal = subtotal / 1.10
    const servicioVal = baseVal * 0.10

    return (
      <div className="st-modal-backdrop" onClick={() => setTicketSeleccionado(null)} role="dialog" aria-modal="true">
        <div className="st-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="st-ticket">
            <div style={{ textAlign: 'center' }}>
              {/* El nombre del local sale de la sesión, no de uno fijo. */}
              <div style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 18, letterSpacing: '0.02em' }}>
                {nombreRestaurante.toUpperCase()}
              </div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>BOLETA DE VENTA ELECTRÓNICA</div>
              <div>Nº B001-{String(ticketSeleccionado.id_pago).slice(-6).padStart(6, '0')}</div>
            </div>

            <div className="st-ticket__sep" />

            <div>
              <div>Fecha: {new Date(ticketSeleccionado.fecha_pago).toLocaleDateString()} {new Date(ticketSeleccionado.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div>Mesa: {ticketSeleccionado.id_mesa}</div>
            </div>

            <div className="st-ticket__sep" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div className="st-ticket__row" style={{ fontWeight: 700 }}>
                <span>CANT / PRODUCTO</span><span>TOTAL</span>
              </div>
              {ticketSeleccionado.items && ticketSeleccionado.items.length > 0 ? (
                ticketSeleccionado.items.map((it, idx) => (
                  <div key={idx} className="st-ticket__row">
                    <span>{it.cantidad}× {it.nombre}</span>
                    <span>S/ {(Number(it.precio) * it.cantidad).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="st-ticket__row">
                  <span>1× Consumo general</span><span>S/ {baseVal.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="st-ticket__sep" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div className="st-ticket__row"><span>Subtotal platos</span><span>S/ {baseVal.toFixed(2)}</span></div>
              <div className="st-ticket__row"><span>Servicio (10%)</span><span>S/ {servicioVal.toFixed(2)}</span></div>
              {ticketSeleccionado.propina > 0 && (
                <div className="st-ticket__row"><span>Propina</span><span>S/ {Number(ticketSeleccionado.propina).toFixed(2)}</span></div>
              )}
              <div className="st-ticket__row" style={{ fontWeight: 800, fontSize: 14, marginTop: 4 }}>
                <span>TOTAL</span><span>S/ {Number(ticketSeleccionado.monto_total).toFixed(2)}</span>
              </div>
            </div>

            <div className="st-ticket__sep" />

            <div style={{ textAlign: 'center' }}>
              <div>Método de pago: {String(ticketSeleccionado.metodo_pago).toUpperCase()}</div>
              <div style={{ marginTop: 6 }}>¡Gracias por su preferencia!</div>
            </div>
          </div>

          <button className="st-act st-act--quiet" onClick={() => setTicketSeleccionado(null)}>Cerrar boleta</button>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */

  return (
    <div className="st-panel">
      <header className="st-panel__bar">
        <button className="st-back" onClick={() => navigate('/')} aria-label="Salir del panel">
          <ChevronLeft size={22} strokeWidth={2.6} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
          <span className="st-topbar__name" style={{ fontSize: 19 }}>{nombreRestaurante}</span>
          <span className="st-topbar__meta">Panel de operaciones</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="st-back"
            onClick={() => setSonidoHabilitado(!sonidoHabilitado)}
            aria-label={sonidoHabilitado ? 'Silenciar alertas' : 'Activar sonido de alertas'}
            title={sonidoHabilitado ? 'Silenciar alertas' : 'Activar sonido'}
          >
            {sonidoHabilitado
              ? <Volume2 size={19} strokeWidth={2.2} color="var(--st-lime)" />
              : <VolumeX size={19} strokeWidth={2.2} color="var(--st-text-3)" />}
          </button>
          <button className="st-back" onClick={() => cargarDatos(true)} aria-label="Actualizar datos">
            <RefreshCw size={18} strokeWidth={2.2} className={cargando ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="st-tabs" style={{ flex: '1 1 340px' }}>
          {MODOS.map(m => {
            const Icono = m.icono
            return (
              <button
                key={m.id}
                className={`st-tab ${vistaModo === m.id ? 'st-tab--on' : ''}`}
                onClick={() => { setVistaModo(m.id); setMesaSeleccionada(null) }}
              >
                <Icono size={16} strokeWidth={2.3} />
                {m.label}
                {m.id === 'salon' && totalPendientes > 0 && (
                  <span
                    className="st-chip"
                    style={{ background: 'var(--st-accent)', color: '#fff', padding: '2px 7px', fontSize: 10 }}
                  >
                    {totalPendientes}
                  </span>
                )}
                {m.id === 'cocina' && comandasCocina.length > 0 && (
                  <span
                    className="st-chip"
                    style={{ background: 'var(--st-amber)', color: 'var(--st-ink)', padding: '2px 7px', fontSize: 10 }}
                  >
                    {comandasCocina.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </header>

      <div className="st-panel__main">
        {vistaModo === 'salon' && renderSalon()}
        {vistaModo === 'cocina' && renderCocina()}
        {vistaModo === 'caja' && renderCaja()}
        {vistaModo === 'metricas' && (
          <Metricas
            idRestaurante={idRestaurante}
            pagos={pagos}
            todosPedidos={todosPedidos}
            mesas={mesas}
          />
        )}
      </div>

      {renderDetalleMesa()}
      {renderBoleta()}

      {confirmModalOpen && (
        <div className="st-modal-backdrop" role="dialog" aria-modal="true">
          <div className="st-modal" style={{ maxWidth: 420 }}>
            <h2 className="st-h2" style={{ fontSize: 22 }}>¿Liberar la mesa {mesaALiberar}?</h2>
            <p className="st-lead" style={{ fontSize: 14.5 }}>
              Se cierra la sesión, se borran los comensales actuales y se genera un PIN nuevo.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="st-act st-act--quiet"
                style={{ flex: 1, padding: 13 }}
                onClick={() => { setConfirmModalOpen(false); setMesaALiberar(null) }}
              >
                Cancelar
              </button>
              <button className="st-act st-act--danger" style={{ flex: 1, padding: 13 }} onClick={confirmarLiberarMesa}>
                Liberar mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
