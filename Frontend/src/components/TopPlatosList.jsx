import React from 'react'
import { calcularTopPlatos } from '../utils/metricas'
import { TrendingUp } from 'lucide-react'

/**
 * Lista ranking con los platos más vendidos del período.
 * Muestra barra de progreso proporcional al más vendido.
 */
export default function TopPlatosList({ pedidos, top = 5 }) {
  const lista = calcularTopPlatos(pedidos, top)
  const maxCantidad = lista[0]?.cantidad || 0

  if (lista.length === 0) {
    return (
      <div className="chart-wrapper">
        <div className="chart-header">
          <h3 className="chart-title">Top {top} platos más vendidos</h3>
          <span className="chart-subtitle">Ranking por unidades vendidas</span>
        </div>
        <div className="chart-empty">
          <p>Aún no hay pedidos pagados para mostrar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h3 className="chart-title">Top {top} platos más vendidos</h3>
        <span className="chart-subtitle">Ranking por unidades vendidas</span>
      </div>

      <ol className="top-platos-list">
        {lista.map((p, idx) => {
          const pct = maxCantidad > 0 ? (p.cantidad / maxCantidad) * 100 : 0
          const medalColors = ['#F59E0B', '#94A3B8', '#B45309'] // oro, plata, bronce
          const rankColor = idx < 3 ? medalColors[idx] : 'var(--text-3)'
          return (
            <li key={p.nombre} className="top-platos-item">
              <div className="top-platos-rank" style={{ color: rankColor }}>
                #{idx + 1}
              </div>
              <div className="top-platos-info">
                <div className="top-platos-row">
                  <span className="top-platos-name">{p.nombre}</span>
                  <span className="top-platos-stats">
                    <strong>{p.cantidad}</strong>
                    <span className="top-platos-unit">und</span>
                    <span className="top-platos-sep">·</span>
                    <span className="top-platos-revenue">
                      <TrendingUp size={11} style={{ verticalAlign: '-1px', marginRight: 3 }} />
                      S/ {Number(p.ingresos).toFixed(2)}
                    </span>
                  </span>
                </div>
                <div className="top-platos-bar">
                  <div
                    className="top-platos-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
