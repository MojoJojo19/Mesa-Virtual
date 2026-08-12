import React, { useState, useEffect, useMemo } from 'react'
import { DollarSign, Receipt, TrendingUp, Heart, BarChart3, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { getPagos, getPedidosTodos, getMesas } from '../services/api'
import {
  calcularKpis,
  filtrarPagosPorPeriodo,
  obtenerRangoPeriodo,
  etiquetaPeriodo,
} from '../utils/metricas'
import KpiCard from '../components/KpiCard'
import PeriodoSelector from '../components/PeriodoSelector'
import VentasPorHoraChart from '../components/VentasPorHoraChart'
import MetodosPagoDonut from '../components/MetodosPagoDonut'
import TopPlatosList from '../components/TopPlatosList'
import OcupacionRing from '../components/OcupacionRing'

const formatearSoles = (v) => `S/ ${Number(v || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/**
 * Dashboard de métricas. Recibe los datos crudos (pagos, pedidos, mesas)
 * ya cargados por el padre (Logistica.jsx) y los agrega.
 * Hace polling propio cada 30s, más espaciado que las otras vistas.
 */
export default function Metricas({ idRestaurante, pagos: pagosIniciales, todosPedidos: pedidosIniciales, mesas: mesasIniciales }) {
  const [periodo, setPeriodo] = useState('hoy')
  const [pagos, setPagos] = useState(pagosIniciales || [])
  const [todosPedidos, setTodosPedidos] = useState(pedidosIniciales || [])
  const [mesas, setMesas] = useState(mesasIniciales || [])
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date())
  const [cargando, setCargando] = useState(false)

  // Sincronizar cuando el padre refresca (cada 5s)
  useEffect(() => {
    setPagos(pagosIniciales || [])
    setTodosPedidos(pedidosIniciales || [])
    setMesas(mesasIniciales || [])
  }, [pagosIniciales, pedidosIniciales, mesasIniciales])

  // Polling propio cada 30s para refrescar del backend directamente
  useEffect(() => {
    if (!idRestaurante) return

    const cargar = async () => {
      setCargando(true)
      try {
        const [p, ped, m] = await Promise.all([
          getPagos(idRestaurante),
          getPedidosTodos(idRestaurante),
          getMesas(idRestaurante),
        ])
        setPagos(p || [])
        setTodosPedidos(ped || [])
        setMesas(m || [])
        setUltimaActualizacion(new Date())
      } catch (e) {
        console.error('Error actualizando métricas:', e)
      } finally {
        setCargando(false)
      }
    }

    // Primera carga explícita
    cargar()

    const interval = setInterval(cargar, 30000)
    return () => clearInterval(interval)
  }, [idRestaurante])

  // Cálculos memoizados — solo se recalculan cuando cambian los datos o el período
  const kpis = useMemo(() => calcularKpis(pagos, periodo), [pagos, periodo])
  const pagosPeriodo = useMemo(() => filtrarPagosPorPeriodo(pagos, periodo), [pagos, periodo])
  const pedidosPagados = useMemo(
    () => todosPedidos.filter((p) => p.estado === 'pagado' || p.estado === 'servido'),
    [todosPedidos]
  )
  // Para top platos, usamos los pedidos del período seleccionado
  const pedidosEnRango = useMemo(() => {
    const { inicio, fin } = obtenerRangoPeriodo(periodo)
    return pedidosPagados.filter((p) => {
      const f = new Date(p.fecha_hora)
      return f >= inicio && f <= fin
    })
  }, [pedidosPagados, periodo])

  const ventas = kpis.ventas
  const ticket = kpis.ticketPromedio
  const pedidos = kpis.pedidos
  const propinas = kpis.propinas

  return (
    <div className="animate-fade-in">
      {/* Cabecera: título + selector de período + última actualización */}
      <div className="metricas-header">
        <div className="metricas-header-titles">
          <div className="metricas-header-icon">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="metricas-title">Análisis del negocio</h2>
            <p className="metricas-subtitle">
              {etiquetaPeriodo(periodo)} · Última actualización{' '}
              {ultimaActualizacion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              {cargando ? (
                <span className="metricas-status refreshing">
                  <RefreshCw size={11} className="animate-spin" /> Actualizando…
                </span>
              ) : (
                <span className="metricas-status">
                  <Wifi size={11} color="var(--green)" /> En vivo
                </span>
              )}
            </p>
          </div>
        </div>
        <PeriodoSelector value={periodo} onChange={setPeriodo} />
      </div>

      {/* Fila de KPIs */}
      <div className="kpi-grid">
        <KpiCard
          label="Ventas totales"
          value={formatearSoles(ventas)}
          delta={kpis.delta.ventas}
          icon={DollarSign}
          color="green"
        />
        <KpiCard
          label="Pedidos"
          value={pedidos.toLocaleString('es-PE')}
          delta={kpis.delta.pedidos}
          icon={Receipt}
          color="accent"
        />
        <KpiCard
          label="Ticket promedio"
          value={formatearSoles(ticket)}
          delta={kpis.delta.ticketPromedio}
          icon={TrendingUp}
          color="blue"
        />
        <KpiCard
          label="Propinas"
          value={formatearSoles(propinas)}
          delta={kpis.delta.propinas}
          icon={Heart}
          color="purple"
        />
      </div>

      {/* Grilla principal: 2 filas */}
      <div className="metricas-grid">
        {/* Fila 1: gráfico grande + anillo de ocupación */}
        <div className="metricas-card metricas-card-8">
          <VentasPorHoraChart pagos={pagosPeriodo} />
        </div>
        <div className="metricas-card metricas-card-4">
          <OcupacionRing mesas={mesas} />
        </div>

        {/* Fila 2: top platos + métodos de pago */}
        <div className="metricas-card metricas-card-6">
          <TopPlatosList pedidos={pedidosEnRango} top={5} />
        </div>
        <div className="metricas-card metricas-card-6">
          <MetodosPagoDonut pagos={pagosPeriodo} />
        </div>
      </div>

      {/* Pie de página */}
      <div className="metricas-footer">
        <span>
          {pagosPeriodo.length} pago{pagosPeriodo.length !== 1 ? 's' : ''} procesado
          {pagosPeriodo.length !== 1 ? 's' : ''} en el período
        </span>
        <span>Auto-actualización cada 30 s</span>
      </div>
    </div>
  )
}
