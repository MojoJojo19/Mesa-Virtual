import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag } from 'lucide-react'
import { getPlatos, getCategorias } from '../services/api'
import { useToast } from '../components/Toast'

export default function Menu() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [carrito, setCarrito] = useState([])
  const [platos, setPlatos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoria, setCategoria] = useState(1) // Por defecto id 1
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const [platosData, catsData] = await Promise.all([
          getPlatos(),
          getCategorias()
        ])
        setPlatos(platosData || [])
        setCategorias(catsData || [])
        if (catsData && catsData.length > 0) {
          setCategoria(catsData[0].id_categoria)
        }
      } catch (e) {
        toast('Error al cargar el menú', 'error')
      } finally {
        setCargando(false)
      }
    }
    fetchDatos()
  }, [toast])

  useEffect(() => {
    const prevCart = localStorage.getItem('swifttable_carrito')
    if (prevCart) setCarrito(JSON.parse(prevCart))
  }, [])

  const platosFiltrados = platos.filter(p => p.id_categoria === categoria)

  const getCantidad = (id) => {
    const item = carrito.find(p => p.id_producto === id)
    return item ? item.cantidad : 0
  }

  const aumentar = (plato) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.id_producto === plato.id_producto)
      if (existe) return prev.map(p => p.id_producto === plato.id_producto ? { ...p, cantidad: p.cantidad + 1 } : p)
      return [...prev, { ...plato, cantidad: 1 }]
    })
  }

  const disminuir = (plato) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.id_producto === plato.id_producto)
      if (!existe) return prev
      if (existe.cantidad === 1) return prev.filter(p => p.id_producto !== plato.id_producto)
      return prev.map(p => p.id_producto === plato.id_producto ? { ...p, cantidad: p.cantidad - 1 } : p)
    })
  }

  const handleConfirmar = () => {
    if (carrito.length === 0) return
    localStorage.setItem('swifttable_carrito', JSON.stringify(carrito))
    navigate(`/mesa/${idMesa}/pedido-grupo`)
  }

  const limpiarCarrito = () => {
    setCarrito([])
    localStorage.removeItem('swifttable_carrito')
  }

  const totalItems = carrito.reduce((sum, p) => sum + p.cantidad, 0)
  const totalMonto = carrito.reduce((sum, p) => sum + (Number(p.precio || 0) * p.cantidad), 0)

  return (
    <>
      <div className="native-app-bar" style={{ paddingBottom: '8px' }}>
        <div className="left-action">
          <button className="wf-btn-ghost" onClick={() => navigate(-1)} style={{ padding: 0 }}>
            <span style={{ fontSize: '28px', color: 'var(--accent)' }}>‹</span>
          </button>
        </div>
        <div className="title" style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em' }}>Menú</div>
        <div className="right-action">
          {totalItems > 0 && (
            <button className="wf-btn-ghost" style={{ color: 'var(--red)', fontSize: '14px' }} onClick={limpiarCarrito}>
              Vaciar
            </button>
          )}
        </div>
      </div>

      {/* Tabs Ancladas al header */}
      <div style={{ position: 'sticky', top: 'calc(58px + var(--safe-top))', zIndex: 40, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid var(--border)' }}>
        <div className="category-tabs" style={{ margin: 0, padding: '12px 16px' }}>
          {categorias.map(cat => (
            <div
              key={cat.id_categoria}
              className={`category-tab ${categoria === cat.id_categoria ? 'active' : ''}`}
              onClick={() => setCategoria(cat.id_categoria)}
            >
              {cat.nombre}
            </div>
          ))}
        </div>
      </div>

      <div className="content-wrapper" style={{ padding: '0 16px calc(120px + var(--safe-bottom))' }}>
        
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>Cargando...</div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            {platosFiltrados.map((plato, i) => {
              const cant = getCantidad(plato.id_producto)
              const isInCart = cant > 0
              return (
                <div key={plato.id_producto} className={`menu-item-card ${isInCart ? 'in-cart' : ''} animate-pop stagger-${(i % 5) + 1}`}>
                  <div className="menu-item-thumb">
                    {plato.imagen_url ? (
                      <img src={plato.imagen_url} alt={plato.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <span style={{ fontSize: '24px' }}>🍗</span>
                    )}
                  </div>
                  
                  <div className="menu-item-info">
                    <div className="menu-item-name">{plato.nombre}</div>
                    <div className="menu-item-desc">{plato.descripcion}</div>
                    <div className="menu-item-price">S/ {Number(plato.precio || 0).toFixed(2)}</div>
                  </div>

                  <div className="qty-control">
                    {cant > 0 ? (
                      <>
                        <button className="qty-btn" onClick={() => disminuir(plato)}>-</button>
                        <div className="qty-num">{cant}</div>
                        <button className="qty-btn plus" onClick={() => aumentar(plato)}>+</button>
                      </>
                    ) : (
                      <button className="qty-btn plus" style={{ width: 'auto', padding: '0 12px', borderRadius: '16px', fontSize: '15px', fontWeight: '600' }} onClick={() => aumentar(plato)}>Agregar</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <div className="native-bottom-bar" style={{ display: 'flex', gap: '16px', padding: '16px' }}>
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: '500' }}>{totalItems} items</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-1)' }}>S/ {totalMonto.toFixed(2)}</span>
          </div>
          <button className="wf-btn-solid" style={{ flex: 1, padding: '16px' }} onClick={handleConfirmar}>
            Revisar Pedido
          </button>
        </div>
      )}
    </>
  )
}
