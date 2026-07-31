import React from 'react'
import { colorComensal, inicial } from '../theme/sala'

/**
 * Ficha de color con la inicial del comensal.
 * Reemplaza a los avatares de emoji: una sola familia visual en toda la app.
 */
export default function Monograma({ nombre, avatar, size = 44, radius = 14, fuente, style, className = '', ...resto }) {
  const color = colorComensal(avatar, nombre)

  return (
    <div
      className={`st-tile ${className}`.trim()}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color.hex,
        color: color.fg,
        fontSize: fuente || Math.round(size * 0.5),
        ...style
      }}
      {...resto}
    >
      {inicial(nombre)}
    </div>
  )
}
