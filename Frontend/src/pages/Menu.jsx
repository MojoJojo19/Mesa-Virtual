import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPlatos } from '../services/api'

export default function Menu() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const [carrito, setCarrito] = useState([])
  const [platos, setPlatos] = useState([])

  useEffect(() => {
    // Cargar los platos de la base de datos de PostgreSQL al abrir el menú
    getPlatos().then(data => {
      if (data && data.length > 0) {
        setPlatos(data)
      }
    })
  }, [])

  const total = carrito.reduce((sum, item) => sum + Number(item.precio || 0), 0)

  const togglePlato = (plato) => {
    if (carrito.find(p => p.id_producto === plato.id_producto)) {
      setCarrito(carrito.filter(p => p.id_producto !== plato.id_producto))
    } else {
      setCarrito([...carrito, plato])
    }
  }

  return (
    <>
      <div className="top-bar" style={{ marginBottom: '10px' }}>
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '15px' }}>
        Bienvenido a La Fogata — elige lo que deseas
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', border: '1px solid var(--color-border-primary)', borderRadius: '15px', padding: '5px 12px', backgroundColor: 'var(--color-border-secondary)', color: 'white' }}>Pollos</div>
        <div style={{ fontSize: '11px', border: '1px solid var(--color-border-tertiary)', borderRadius: '15px', padding: '5px 12px', color: 'var(--color-text-secondary)' }}>Bebidas</div>
        <div style={{ fontSize: '11px', border: '1px solid var(--color-border-tertiary)', borderRadius: '15px', padding: '5px 12px', color: 'var(--color-text-secondary)' }}>Entradas</div>
      </div>

      <span className="wf-label" style={{ textTransform: 'uppercase', marginBottom: '10px' }}>Platos principales</span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {platos.map(plato => {
          const isAdded = carrito.find(p => p.id_producto === plato.id_producto)
          return (
            <div key={plato.id_producto} className="wf-block" style={{ marginBottom: 0, padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{
                    width: '40px', height: '40px', border: '1px dashed var(--color-border-tertiary)',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                  }}>
                    {plato.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{plato.nombre}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '2px 0' }}>{plato.descripcion}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>S/ {Number(plato.precio || 0).toFixed(2)}</div>
                  </div>
                </div>
                <button 
                  onClick={() => togglePlato(plato)}
                  style={{
                    backgroundColor: isAdded ? 'transparent' : 'var(--color-border-tertiary)',
                    border: '1px solid var(--color-border-primary)',
                    color: isAdded ? 'white' : 'var(--color-text-secondary)',
                    borderRadius: '8px', padding: '6px 10px', fontSize: '11px',
                    minWidth: '85px', transition: 'all 0.2s'
                  }}
                >
                  {isAdded ? '✓ Agregado' : '+ Agregar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {carrito.length > 0 && (
        <div className="wf-block" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-border-tertiary)', borderColor: 'var(--color-border-primary)' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{carrito.length} producto(s) en pedido</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>S/ {Number(total).toFixed(2)}</div>
          </div>
          <button 
            onClick={() => navigate(`/mesa/${idMesa}/resumen`)}
            style={{
              backgroundColor: 'white', color: 'black', border: 'none', borderRadius: '8px',
              padding: '10px 15px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
            }}
          >
            Confirmar pedido
          </button>
        </div>
      )}
    </>
  )
}
