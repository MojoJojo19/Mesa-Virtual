import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

function ToastItem({ toast, onRemove }) {
  // Manejo visual basado en el type
  let icon = '🔔'
  let className = 'toast-info'

  if (toast.type === 'success') { icon = '✓'; className = 'toast-success' }
  if (toast.type === 'error')   { icon = '✕'; className = 'toast-error' }
  if (toast.type === 'warning') { icon = '⚠️'; className = 'toast-warning' }

  return (
    <div className={`toast ${className}`} onClick={() => onRemove(toast.id)}>
      <span style={{ fontSize: '15px' }}>{icon}</span>
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
