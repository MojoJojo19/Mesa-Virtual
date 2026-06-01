import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

// Componente visual de un toast individual
function ToastItem({ toast, onRemove }) {
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }
  const colors = {
    success: 'var(--color-success)',
    error:   '#f87171',
    info:    'var(--color-accent)',
    warning: '#fbbf24'
  }
  const color = colors[toast.type] || colors.info

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 14px',
      background: 'var(--color-background-secondary)',
      border: `1px solid ${color}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      animation: 'slideUp 0.3s ease',
      maxWidth: '340px',
      width: '100%',
      cursor: 'pointer',
    }}
    onClick={() => onRemove(toast.id)}
    >
      <span style={{ fontSize: '14px', color, flexShrink: 0, marginTop: '1px' }}>
        {icons[toast.type] || icons.info}
      </span>
      <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: '1.4' }}>
        {toast.message}
      </span>
    </div>
  )
}

// Provider que envuelve la app
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Contenedor de toasts — fuera del app-container */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        zIndex: 9999,
        pointerEvents: 'none',
        width: 'calc(100% - 40px)',
        maxWidth: '380px',
        alignItems: 'center'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto', width: '100%' }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
