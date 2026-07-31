import React, { createContext, useContext, useState, useCallback } from 'react'
import { Bell, Check, X, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

/* Un solo lenguaje de iconos en toda la app: nada de emojis. */
const ESTILOS = {
  info:    { Icono: Bell,           color: 'var(--st-cyan)'  },
  success: { Icono: Check,          color: 'var(--st-lime)'  },
  error:   { Icono: X,              color: '#FF6B76'         },
  warning: { Icono: AlertTriangle,  color: 'var(--st-amber)' }
}

function ToastItem({ toast, onRemove }) {
  const { Icono, color } = ESTILOS[toast.type] || ESTILOS.info

  return (
    <div
      className={`toast toast-${toast.type}`}
      onClick={() => onRemove(toast.id)}
      role="status"
      style={{ pointerEvents: 'auto' }}
    >
      <Icono size={16} strokeWidth={3} color={color} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{toast.message}</span>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
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
      <div className="toast-container">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
