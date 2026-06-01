import React from 'react'

// Pasos del flujo completo
const PASOS = [
  { ruta: /\/mesa\/\d+$/, label: 'Acceso' },
  { ruta: /\/(pin|acceso|ingreso)/, label: 'Ingreso' },
  { ruta: /\/(lobby|pago-modo)/, label: 'Sala' },
  { ruta: /\/(menu|pedido-grupo)/, label: 'Menú' },
  { ruta: /\/(confirmado|resumen)/, label: 'Pago' },
]

export default function StepBar({ pathname }) {
  // Detectar paso actual
  const pasoActual = PASOS.findIndex(p => p.ruta.test(pathname))

  if (pasoActual < 0) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      marginBottom: '18px',
      paddingBottom: '14px',
      borderBottom: '1px solid var(--color-border-tertiary)',
    }}>
      {PASOS.map((paso, i) => {
        const esActual    = i === pasoActual
        const esCompletado = i < pasoActual
        const esFuturo    = i > pasoActual

        return (
          <React.Fragment key={paso.label}>
            {/* Nodo del paso */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: esActual ? '22px' : '16px',
                height: esActual ? '22px' : '16px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: esActual ? '10px' : '8px',
                fontWeight: '700',
                border: esCompletado
                  ? '2px solid var(--color-success)'
                  : esActual
                    ? '2px solid var(--color-accent)'
                    : '1.5px solid var(--color-border-secondary)',
                background: esCompletado
                  ? 'var(--color-success-dim)'
                  : esActual
                    ? 'var(--color-accent-dim)'
                    : 'transparent',
                color: esCompletado
                  ? 'var(--color-success)'
                  : esActual
                    ? 'var(--color-accent)'
                    : 'var(--color-text-tertiary)',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}>
                {esCompletado ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: '9px',
                color: esActual
                  ? 'var(--color-accent)'
                  : esCompletado
                    ? 'var(--color-success)'
                    : 'var(--color-text-tertiary)',
                fontWeight: esActual ? '600' : '400',
                transition: 'color 0.3s',
                whiteSpace: 'nowrap',
              }}>
                {paso.label}
              </span>
            </div>

            {/* Línea conectora */}
            {i < PASOS.length - 1 && (
              <div style={{
                flex: 1,
                height: '1.5px',
                marginBottom: '14px',
                background: esCompletado
                  ? 'var(--color-success)'
                  : 'var(--color-border-tertiary)',
                transition: 'background 0.4s ease',
                maxWidth: '40px',
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
