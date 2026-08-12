import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { agruparMetodosPago } from '../utils/metricas'

const COLORES = {
  efectivo: '#10B981',
  tarjeta: '#3B82F6',
  yape: '#A855F7',
  plin: '#F59E0B',
}

const ETIQUETAS = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
}

const ORDEN = ['efectivo', 'tarjeta', 'yape', 'plin']

export default function MetodosPagoDonut({ pagos }) {
  const data = agruparMetodosPago(pagos)
    .filter((d) => d.monto > 0)
    .sort((a, b) => ORDEN.indexOf(a.metodo) - ORDEN.indexOf(b.metodo))

  const total = data.reduce((acc, d) => acc + d.monto, 0)

  const tooltipFormatter = (value, name, props) => {
    const item = props.payload
    const pct = total > 0 ? ((item.monto / total) * 100).toFixed(1) : '0'
    return [`S/ ${Number(item.monto).toFixed(2)} (${pct}%)`, ETIQUETAS[item.metodo] || item.metodo]
  }

  const renderLegend = (props) => {
    const { payload } = props
    return (
      <ul className="donut-legend">
        {payload.map((entry, idx) => {
          const item = data.find((d) => d.metodo === entry.value)
          if (!item) return null
          const pct = total > 0 ? ((item.monto / total) * 100).toFixed(0) : 0
          return (
            <li key={idx} className="donut-legend-item">
              <span className="donut-legend-dot" style={{ background: entry.color }} />
              <div className="donut-legend-text">
                <span className="donut-legend-label">{ETIQUETAS[item.metodo] || item.metodo}</span>
                <span className="donut-legend-value">
                  S/ {Number(item.monto).toFixed(2)} · {pct}%
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h3 className="chart-title">Métodos de pago</h3>
        <span className="chart-subtitle">Distribución porcentual del volumen cobrado</span>
      </div>

      <div className="chart-body donut-body" style={{ height: 260 }}>
        {total === 0 ? (
          <div className="chart-empty">
            <p>No hay pagos registrados en el período seleccionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="monto"
                nameKey="metodo"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                stroke="var(--surface)"
                strokeWidth={2}
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={COLORES[entry.metodo] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-1)',
                }}
                formatter={tooltipFormatter}
              />
              <Legend
                content={renderLegend}
                verticalAlign="middle"
                align="right"
                layout="vertical"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
