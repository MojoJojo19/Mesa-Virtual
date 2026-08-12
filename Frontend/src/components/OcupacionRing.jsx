import React from 'react'
import { calcularOcupacionActual } from '../utils/metricas'
import { Users } from 'lucide-react'

/**
 * Anillo SVG con el porcentaje de mesas ocupadas actualmente.
 * Color dinámico: verde si < 60%, amarillo si < 85%, rojo si >= 85%.
 */
export default function OcupacionRing({ mesas }) {
  const { porcentaje, ocupadas, total } = calcularOcupacionActual(mesas)

  const radio = 70
  const circunferencia = 2 * Math.PI * radio
  const dashOffset = circunferencia * (1 - porcentaje / 100)

  let color = '#10B981' // verde
  let estado = 'Suelto'
  if (porcentaje >= 85) {
    color = '#EF4444' // rojo
    estado = 'Casi lleno'
  } else if (porcentaje >= 60) {
    color = '#F59E0B' // amarillo
    estado = 'Movido'
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h3 className="chart-title">Ocupación actual</h3>
        <span className="chart-subtitle">Estado del salón en tiempo real</span>
      </div>

      <div className="ocupacion-body">
        <svg width="180" height="180" viewBox="0 0 180 180" className="ocupacion-svg">
          {/* Track */}
          <circle
            cx="90"
            cy="90"
            r={radio}
            fill="none"
            stroke="var(--border)"
            strokeWidth="14"
          />
          {/* Progreso */}
          <circle
            cx="90"
            cy="90"
            r={radio}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 90 90)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          {/* Texto central */}
          <text
            x="90"
            y="92"
            textAnchor="middle"
            fontSize="36"
            fontWeight="800"
            fill="var(--text-1)"
            fontFamily="var(--font-display, sans-serif)"
          >
            {porcentaje}%
          </text>
          <text
            x="90"
            y="115"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="var(--text-2)"
            style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {estado}
          </text>
        </svg>

        <div className="ocupacion-stats">
          <div className="ocupacion-stat-row">
            <Users size={14} color="var(--accent)" />
            <span className="ocupacion-stat-label">Mesas ocupadas</span>
            <span className="ocupacion-stat-value">{ocupadas} / {total}</span>
          </div>
          <div className="ocupacion-stat-row">
            <span className="ocupacion-dot" style={{ background: '#10B981' }} />
            <span className="ocupacion-stat-label">Libres ahora</span>
            <span className="ocupacion-stat-value">{total - ocupadas}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
