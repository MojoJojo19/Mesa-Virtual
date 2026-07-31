import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { inicial, nombreRestaurante } from '../theme/sala'

/**
 * Cabecera del restaurante, común a todo el flujo del comensal.
 *
 * El nombre siempre sale de lo que se guardó al escanear el QR, así que la
 * misma cabecera sirve para cualquier local. Con `onBack` muestra el botón
 * de volver; sin él, muestra la ficha del restaurante con su acento.
 */
export default function TopBar({ meta, onBack, derecha, nombre: nombreProp }) {
  // Bienvenida aún está resolviendo el nombre cuando monta, así que puede
  // pasarlo por prop; el resto de pantallas ya lo tiene en localStorage.
  const nombre = nombreProp || nombreRestaurante()

  return (
    <header className="st-topbar">
      {onBack ? (
        <button className="st-back" onClick={onBack} aria-label="Volver">
          <ChevronLeft size={22} strokeWidth={2.6} />
        </button>
      ) : (
        <div
          className="st-tile"
          aria-hidden="true"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'var(--st-accent)',
            color: '#fff',
            fontSize: 20
          }}
        >
          {inicial(nombre)}
        </div>
      )}

      <div className="st-topbar__texts">
        <div className="st-topbar__name">{nombre}</div>
        {meta && <div className="st-topbar__meta">{meta}</div>}
      </div>

      {derecha && <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{derecha}</div>}
    </header>
  )
}
