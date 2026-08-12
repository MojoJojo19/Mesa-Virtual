import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { agruparVentasPorHora } from '../utils/metricas'

/**
 * Gráfico de barras con las ventas agrupadas por hora del día.
 * Muestra solo el rango 10am–00am para reducir ruido (los locales cierran a esa hora).
 * Resalta la barra más alta en color accent.
 */
export default function VentasPorHoraChart({ pagos }) {
  const data = agruparVentasPorHora(pagos)
  // Filtramos a un rango útil para un restaurante: 10am → 00am (siguiente día)
  const horasAMostrar = [...data.slice(10), ...data.slice(0, 1)]
  const maxVenta = Math.max(...horasAMostrar.map((d) => d.ventas), 0)

  const formatearMoneda = (v) => `S/ ${Number(v || 0).toFixed(0)}`
  const tooltipFormatter = (v, name, props) => {
    if (name === 'ventas') return [`S/ ${Number(v).toFixed(2)}`, 'Ventas']
    if (name === 'pedidos') return [v, 'Pedidos']
    return [v, name]
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h3 className="chart-title">Ventas por hora</h3>
        <span className="chart-subtitle">Distribución de la facturación a lo largo del día</span>
      </div>

      <div className="chart-body" style={{ height: 260 }}>
        {maxVenta === 0 ? (
          <div className="chart-empty">
            <p>No hay ventas registradas en el período seleccionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={horasAMostrar} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--text-3)' }}
                stroke="var(--border)"
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-3)' }}
                stroke="var(--border)"
                tickFormatter={formatearMoneda}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-1)',
                }}
                formatter={tooltipFormatter}
                labelStyle={{ color: 'var(--text-2)', fontWeight: 600 }}
              />
              <Bar dataKey="ventas" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {horasAMostrar.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.ventas === maxVenta ? 'var(--accent)' : 'var(--blue)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
