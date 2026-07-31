import React from 'react'

const PASOS = ['PIN', 'PERFIL', 'SALA']

/**
 * Barra de progreso del tramo de acceso.
 * `paso` es el índice del paso actual (0 = PIN, 1 = PERFIL, 2 = SALA).
 */
export default function StepBar({ paso = 0, pasos = PASOS, style }) {
  return (
    <div className="st-steps" style={style}>
      {pasos.map((etiqueta, i) => {
        const estado = i < paso ? 'st-step--done' : i === paso ? 'st-step--active' : ''
        return (
          <div key={etiqueta} className={`st-step ${estado}`}>
            <div className="st-step__bar" />
            <div className="st-step__label">{etiqueta}</div>
          </div>
        )
      })}
    </div>
  )
}
