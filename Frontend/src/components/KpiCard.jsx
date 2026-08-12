import React from 'react'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

/**
 * Tarjeta KPI reutilizable.
 * - label: texto chico superior
 * - value: valor principal (string ya formateado, ej: "S/ 1,250.00")
 * - delta: porcentaje vs período anterior (null si no se puede calcular)
 * - icon: componente lucide-react opcional
 * - color: 'green' | 'red' | 'accent' | 'blue' | 'yellow' | 'purple'
 */
export default function KpiCard({ label, value, delta, icon: Icon, color = 'accent' }) {
  const tieneDelta = delta !== null && delta !== undefined
  const esPositivo = tieneDelta && delta >= 0
  const esNeutro = tieneDelta && Math.abs(delta) < 0.05

  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <span className="section-label kpi-label">{label}</span>
        {Icon && (
          <div className={`kpi-icon kpi-icon-${color}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className={`kpi-value kpi-value-${color}`}>{value}</div>

      {tieneDelta && !esNeutro && (
        <div className={`kpi-delta ${esPositivo ? 'up' : 'down'}`}>
          {esPositivo ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{Math.abs(delta).toFixed(1)}%</span>
          <span className="kpi-delta-label">vs período anterior</span>
        </div>
      )}
      {tieneDelta && esNeutro && (
        <div className="kpi-delta neutral">
          <Minus size={12} />
          <span>Sin cambios</span>
          <span className="kpi-delta-label">vs período anterior</span>
        </div>
      )}
      {!tieneDelta && (
        <div className="kpi-delta neutral">
          <span className="kpi-delta-label">Sin datos previos</span>
        </div>
      )}
    </div>
  )
}
