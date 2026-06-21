import React from 'react'

export default function StepBar({ pathname }) {
  // Ocultar barra en la bienvenida y cuando se envía el pedido
  if (pathname.endsWith('7') || pathname.includes('confirmado')) {
    return null
  }

  const steps = [
    { path: 'pin',        label: 'Mesa' },
    { path: 'ingreso',    label: 'Mesa' },
    { path: 'acceso',     label: 'Mesa' },
    { path: 'lobby',      label: 'Mesa' },
    { path: 'pago-modo',  label: 'Pago' },
    { path: 'menu',       label: 'Menú' },
    { path: 'pedido',     label: 'Resumen' },
    { path: 'resumen',    label: 'Resumen' },
  ]

  let currentIdx = -1
  for (let i = 0; i < steps.length; i++) {
    if (pathname.includes(steps[i].path)) {
      currentIdx = i
      break
    }
  }

  if (currentIdx === -1) return null

  // Reducimos los pasos a 3 fases visuales para no abrumar
  const phases = ['Ingreso', 'Menú', 'Pago']
  let activePhase = 0
  if (currentIdx >= 4) activePhase = 1
  if (currentIdx >= 6) activePhase = 2

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px 0 16px', marginBottom: '8px' }}>
      {phases.map((phase, i) => {
        const isActive = i === activePhase
        const isPast = i < activePhase

        let bgColor = 'var(--surface-2)'
        let borderColor = 'var(--border)'
        let textColor = 'var(--text-3)'

        if (isActive) {
          bgColor = 'var(--accent)'
          borderColor = 'var(--accent)'
          textColor = '#fff'
        } else if (isPast) {
          bgColor = 'var(--green)'
          borderColor = 'var(--green)'
          textColor = '#fff'
        }

        return (
          <React.Fragment key={phase}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              opacity: (isActive || isPast) ? 1 : 0.6
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: bgColor, border: `2px solid ${borderColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: '800', color: textColor,
                transition: 'all var(--t-normal)'
              }}>
                {isPast ? '✓' : i + 1}
              </div>
              {isActive && (
                <span style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>
                  {phase}
                </span>
              )}
            </div>
            {i < phases.length - 1 && (
              <div style={{ width: '20px', height: '2px', background: isPast ? 'var(--green-border)' : 'var(--border)', borderRadius: '2px' }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
