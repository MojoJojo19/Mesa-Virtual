import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPlatos } from '../services/api'
import { useToast } from '../components/Toast'

const CATEGORIAS = ['Pollos', 'Bebidas', 'Entradas', 'Postres']

export default function Menu() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [carrito, setCarrito] = useState([])   // [{ ...plato, cantidad }]
  const [platos, setPlatos] = useState([])
  const [categoria, setCategoria] = useState('Pollos')
  const [cargando, setCargando] = useState(true)
  const [nota, setNota] = useState('')
  const [mostrarNota, setMostrarNota] = useState(false)

  useEffect(() => {
    getPlatos().then(data => {
      setPlatos(data || [])
      setCargando(false)
    })
  }, [])

  const platosFiltrados = platos.filter(p => p.categoria === categoria)

  const getCantidad = (id) => {
    const item = carrito.find(p => p.id_producto === id)
    return item ? item.cantidad : 0
  }

  const totalItems = carrito.reduce((s, p) => s + p.cantidad, 0)
  const total = carrito.reduce((s, p) => s + Number(p.precio || 0) * p.cantidad, 0)

  const aumentar = (plato) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.id_producto === plato.id_producto)
      if (existe) {
        return prev.map(p =>
          p.id_producto === plato.id_producto
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        )
      }
      toast(`${plato.icon} ${plato.nombre} agregado`, 'success', 2000)
      return [...prev, { ...plato, cantidad: 1 }]
    })
  }

  const disminuir = (plato) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.id_producto === plato.id_producto)
      if (!existe) return prev
      if (existe.cantidad === 1) {
        toast(`${plato.nombre} quitado del pedido`, 'info', 1800)
        return prev.filter(p => p.id_producto !== plato.id_producto)
      }
      return prev.map(p =>
        p.id_producto === plato.id_producto
          ? { ...p, cantidad: p.cantidad - 1 }
          : p
      )
    })
  }

  const handleConfirmar = () => {
    if (carrito.length === 0) {
      toast('Agrega al menos un plato para continuar', 'warning')
      return
    }
    localStorage.setItem('swifttable_carrito', JSON.stringify(
      carrito.map(p => ({ ...p, nota }))
    ))
    navigate(`/mesa/${idMesa}/pedido-grupo`)
  }

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div className="animate-fade-in flex-col flex-1">
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Bienvenido a <strong style={{ color: 'var(--color-accent)' }}>La Fogata</strong> — elige lo que deseas
        </p>

        {/* Tabs de categorías */}
        <div className="category-tabs">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              id={`tab-${cat.toLowerCase()}`}
              className={`category-tab ${categoria === cat ? 'active' : ''}`}
              onClick={() => setCategoria(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="wf-label" style={{ marginBottom: '10px' }}>
          {categoria === 'Pollos' && 'Platos principales'}
          {categoria === 'Bebidas' && 'Bebidas'}
          {categoria === 'Entradas' && 'Entradas'}
          {categoria === 'Postres' && 'Postres'}
        </div>

        {/* Lista de platos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
              <div className="animate-pulse">Cargando menú...</div>
            </div>
          ) : platosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
              Sin platos en esta categoría
            </div>
          ) : (
            platosFiltrados.map((plato, idx) => {
              const cantidad = getCantidad(plato.id_producto)
              return (
                <div
                  key={plato.id_producto}
                  className={`wf-block animate-fade-in stagger-${Math.min(idx + 1, 5)}`}
                  style={{
                    marginBottom: 0,
                    borderColor: cantidad > 0 ? 'var(--color-accent)' : 'var(--color-border-tertiary)',
                    transition: 'border-color 0.25s ease'
                  }}
                >
                  <div className="menu-item">
                    <div className="menu-item-icon" style={{ position: 'relative' }}>
                      {plato.icon}
                      {/* Badge de cantidad */}
                      {cantidad > 0 && (
                        <div style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: 'var(--color-accent)',
                          color: '#0f0f0f', fontSize: '10px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          animation: 'scaleIn 0.2s ease',
                        }}>
                          {cantidad}
                        </div>
                      )}
                    </div>

                    <div className="menu-item-info">
                      <div className="menu-item-name">{plato.nombre}</div>
                      <div className="menu-item-desc">{plato.descripcion}</div>
                      <div className="menu-item-price">S/ {Number(plato.precio || 0).toFixed(2)}</div>
                    </div>

                    {/* Contador +/- */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {cantidad > 0 && (
                        <>
                          <button
                            id={`btn-quitar-${plato.id_producto}`}
                            onClick={() => disminuir(plato)}
                            style={{
                              width: '28px', height: '28px', borderRadius: '8px',
                              border: '1px solid var(--color-border-primary)',
                              background: 'var(--color-background-secondary)',
                              color: 'var(--color-text-primary)',
                              fontSize: '16px', fontWeight: '700',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', transition: 'all 0.15s',
                              fontFamily: 'inherit',
                              lineHeight: 1,
                            }}
                          >−</button>
                          <span style={{
                            fontSize: '15px', fontWeight: '700',
                            color: 'var(--color-accent)', minWidth: '16px', textAlign: 'center'
                          }}>
                            {cantidad}
                          </span>
                        </>
                      )}
                      <button
                        id={`btn-agregar-${plato.id_producto}`}
                        onClick={() => aumentar(plato)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          border: `1px solid ${cantidad > 0 ? 'var(--color-accent)' : 'var(--color-border-primary)'}`,
                          background: cantidad > 0 ? 'var(--color-accent-dim)' : 'var(--color-background-secondary)',
                          color: cantidad > 0 ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                          fontSize: '18px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.15s',
                          fontFamily: 'inherit',
                          lineHeight: 1,
                        }}
                      >+</button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Nota para cocina — toggleable */}
        {carrito.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <button
              className="wf-btn-ghost"
              style={{ fontSize: '12px', width: '100%', textAlign: 'left', padding: '8px 4px' }}
              onClick={() => setMostrarNota(!mostrarNota)}
            >
              {mostrarNota ? '▾' : '▸'} {mostrarNota ? 'Ocultar nota' : '+ Agregar nota para cocina'}
            </button>
            {mostrarNota && (
              <textarea
                id="nota-cocina"
                value={nota}
                onChange={e => setNota(e.target.value)}
                placeholder="Ej: Sin cebolla, poco picante..."
                maxLength={120}
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--color-background-primary)',
                  border: '1px solid var(--color-border-secondary)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  resize: 'none',
                  outline: 'none',
                  marginTop: '6px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border-secondary)'}
              />
            )}
          </div>
        )}

        {/* Barra del carrito */}
        {totalItems > 0 && (
          <div className="carrito-bar">
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {totalItems} producto{totalItems > 1 ? 's' : ''} · {carrito.length} plato{carrito.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                S/ {total.toFixed(2)}
              </div>
            </div>
            <button
              id="btn-confirmar-pedido"
              onClick={handleConfirmar}
              style={{
                background: 'linear-gradient(135deg, #f0a060, #e8863a)',
                color: '#0f0f0f', border: 'none', borderRadius: '10px',
                padding: '11px 16px', fontSize: '13px', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(232,134,58,0.4)',
                fontFamily: 'inherit',
              }}
            >
              Confirmar pedido
            </button>
          </div>
        )}
      </div>
    </>
  )
}
