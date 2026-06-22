import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Users, Check, Clock } from 'lucide-react'

export default function PedidoGrupal() {
  const { idMesa } = useParams()
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{"nombre":"Carlos","avatar":"🐱","isLider":true}')
  const isLider = user.isLider || false
  const miCarrito = JSON.parse(localStorage.getItem('swifttable_carrito') || '[]')
  
  const miTotal = miCarrito.reduce((s, p) => s + Number(p.precio || 0) * (p.cantidad || 1), 0)

  const [pedidosMesa, setPedidosMesa] = useState([
    {
      id: user.id || 'u1', nombre: user.nombre || 'Carlos', avatar: user.avatar || '🐱',
      estado: 'listo', isLider, items: miCarrito, total: miTotal
    },
    {
      id: 'u2', nombre: 'Ana', avatar: '🐶', estado: 'listo', isLider: false,
      items: [{ nombre: '1/2 Pollo a la Brasa', cantidad: 1, precio: 37.00 }], total: 37.00
    },
    {
      id: 'u3', nombre: 'Luis', avatar: '🦊', estado: 'eligiendo', isLider: false,
      items: [], total: 0
    }
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPedidosMesa(prev => prev.map(p => {
        if (p.id === 'u3') return { ...p, estado: 'listo', items: [{ nombre: '1/4 Pollo', cantidad: 1, precio: 23.00 }], total: 23.00 }
        return p
      }))
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const todosListos = pedidosMesa.every(p => p.estado === 'listo')
  const totalMesa = pedidosMesa.reduce((sum, p) => sum + p.total, 0)
  const totalItems = pedidosMesa.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.cantidad, 0), 0)

  const restName = localStorage.getItem('swifttable_nombre_restaurante') || 'SwiftTable'

  return (
    <>
      <div className="native-app-bar">
        <div className="left-action">
          <button className="wf-btn-ghost" onClick={() => navigate(-1)} style={{ padding: 0 }}>
            <ChevronLeft size={28} color="var(--accent)" />
          </button>
        </div>
        <div className="title">{restName}</div>
        <div className="right-action"></div>
      </div>

      <div className="content-wrapper">
        <div className="card-accent" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0', border: 'none' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>Total de la Mesa</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>S/ {totalMesa.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}><Users size={14}/> {pedidosMesa.length} pers.</div>
            <div style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: '2px' }}>{totalItems} platos</div>
          </div>
        </div>

        <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Estado por persona</span>
          <span style={{ color: todosListos ? 'var(--green)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {todosListos ? <><Check size={14}/> Listos</> : <><Clock size={14}/> Esperando...</>}
          </span>
        </div>

        <div className="card" style={{ padding: '0' }}>
          {pedidosMesa.map((p, idx) => (
            <div key={p.id} className="list-item" style={{ padding: '16px' }}>
              <div className="avatar-circle" style={{ 
                background: p.estado === 'listo' ? 'var(--green-bg)' : 'var(--bg)',
                color: p.estado === 'listo' ? 'var(--green)' : 'var(--text-3)' 
              }}>
                {p.estado === 'listo' ? p.avatar : <Clock size={20} />}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {p.nombre} {p.id === user.id && <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>(Tú)</span>}
                  {p.isLider && <span style={{ fontSize: '11px', background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>Líder</span>}
                </div>
                {p.estado === 'listo' ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
                    {p.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--text-3)', fontStyle: 'italic', marginTop: '4px' }}>Eligiendo platos...</div>
                )}
              </div>

              {p.estado === 'listo' && (
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  S/ {p.total.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="native-bottom-bar">
        {isLider ? (
          <button 
            className="wf-btn-solid" 
            onClick={() => navigate(`/mesa/${idMesa}/confirmado`)}
            disabled={!todosListos}
          >
            {todosListos ? 'Enviar Pedido a Cocina' : 'Esperando a los demás...'}
          </button>
        ) : (
          <div style={{ width: '100%', textAlign: 'center', padding: '16px', fontSize: '14px', color: 'var(--text-2)', fontWeight: '500' }}>
            Esperando a que el líder envíe el pedido
          </div>
        )}
      </div>
    </>
  )
}
