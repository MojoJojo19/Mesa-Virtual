import React, { useState } from 'react'

const OPCIONES = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'ayer', label: 'Ayer' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mes' },
]

/**
 * Selector de período tipo pills. Estado controlado por el padre.
 */
export default function PeriodoSelector({ value, onChange }) {
  return (
    <div className="periodo-selector" role="tablist" aria-label="Período de métricas">
      {OPCIONES.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            className={`periodo-pill ${active ? 'active' : ''}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
