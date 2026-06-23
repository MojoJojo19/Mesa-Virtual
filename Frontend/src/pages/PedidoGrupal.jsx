import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Users, Check, Clock } from 'lucide-react'
import { useToast } from '../components/Toast'
import { enviarPedido, getMesa } from '../services/api'

export default function PedidoGrupal() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{"nombre":"Carlos","avatar":"🐱","isLider":true}')
  const isLider = user.isLider || false
  const miCarrito = JSON.parse(localStorage.getItem('swifttable_carrito') || '[]')
  
  const miTotal = miCarrito.reduce((s, p) => s + Number(p.precio || 0) * (p.cantidad || 1), 0)

  const miTotal = miCarrito.reduce((s, p) => s + Number(p.precio || 0) * (p.cantidad || 1), 0)

  const [comensales, setComensales] = useState([])
  const [enviando, setEnviando] = useState(false)

  // Polling de los comensales reales de la mesa
  useEffect(() => {
    const fetchComensales = async () => {
      try {
        const data = await getComensalesDeMesa(idMesa)
        // Filtramos solo los que siguen activos en la mesa
        const activos = (data || []).filter(c => c.estado_sesion === 'activa')
        setComensales(activos)
      } catch (err) {
        console.error(err)
      }
    }
    fetchComensales()
    const interval = setInterval(fetchComensales, 3000)
    return () => clearInterval(interval)
  }, [idMesa])

  useEffect(() => {
    const verificarMesa = async () => {
      try {
        const mesaInfo = await getMesa(idMesa)
        if (mesaInfo && mesaInfo.estado === 'libre') {
          toast('Mesa liberada por administración. Sesión finalizada.', 'info')
          localStorage.removeItem('swifttable_carrito')
          localStorage.removeItem('swifttable_user')
          navigate(`/mesa/${idMesa}`)
        }
      } catch (e) {
        console.error(e)
      }
    }
    
    verificarMesa()
    const interval = setInterval(verificarMesa, 4000)
    return () => clearInterval(interval)
  }, [idMesa, navigate, toast])

  const todosListos = comensales.every(c => c.estado_pedido === 'listo')

  const handleEnviarPedido = async () => {
    if (!todosListos) {
      toast('No podemos enviar a cocina hasta que todos estén listos', 'error')
      return
    }
    
    setEnviando(true)
    try {
      const todosItems = []
      comensales.forEach(c => {
        const cart = Array.isArray(c.carrito) ? c.carrito : []
        cart.forEach(it => {
          const existente = todosItems.find(x => x.id_producto === it.id_producto)
          if (existente) {
            existente.cantidad += it.cantidad
          } else if (it.id_producto) {
            todosItems.push({ id_producto: it.id_producto, cantidad: it.cantidad })
          }
        })
      })

      if (todosItems.length === 0) {
        toast('No hay productos en el pedido', 'error')
        setEnviando(false)
        return
      }

      const res = await enviarPedido(idMesa, todosItems)
      localStorage.setItem('swifttable_id_pedido', res.id_pedido)
      toast('¡Pedido enviado a cocina exitosamente!', 'success')
      navigate(`/mesa/${idMesa}/confirmado`)
    } catch (err) {
      toast('Error al enviar el pedido', 'error')
    } finally {
      setEnviando(false)
    }
  }

  const totalMesa = comensales.reduce((sum, c) => {
    const cart = Array.isArray(c.carrito) ? c.carrito : []
    return sum + cart.reduce((s, i) => s + (Number(i.precio || 0) * (i.cantidad || 1)), 0)
  }, 0)
  const totalItems = comensales.reduce((sum, c) => {
    const cart = Array.isArray(c.carrito) ? c.carrito : []
    return sum + cart.reduce((s, i) => s + (i.cantidad || 1), 0)
  }, 0)

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
          {comensales.map(comensal => {
            const isMe = comensal.id_comensal === (user.id_comensal || user.id)
            const cart = Array.isArray(comensal.carrito) ? comensal.carrito : []
            const totalPersona = cart.reduce((s, i) => s + (Number(i.precio || 0) * (i.cantidad || 1)), 0)
            
            return (
              <div key={comensal.id_comensal} className="comensal-order-card" style={{ borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                  <div className="avatar" style={{ fontSize: '24px', width: '48px', height: '48px', background: 'var(--bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {comensal.avatar || '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-1)', fontSize: '15px' }}>
                        {comensal.nombre} {isMe && <span style={{ color: 'var(--text-3)', fontWeight: '500' }}>(Tú)</span>}
                      </span>
                      {comensal.isLider && <span style={{ fontSize: '10px', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', color: 'var(--text-2)' }}>Líder</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                      {comensal.estado_pedido === 'eligiendo' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--orange, #f59e0b)' }}><Clock size={14} /> Eligiendo...</span>
                      ) : (
                        <span>
                          {cart.length > 0 
                            ? cart.map(i => `${i.cantidad}x ${i.nombre}`).join(', ') 
                            : 'Sin pedido'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-1)' }}>
                    {totalPersona > 0 && `S/ ${totalPersona.toFixed(2)}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="native-bottom-bar">
        {isLider ? (
          <button 
            className="wf-btn-solid" 
            onClick={handleEnviarPedido}
            disabled={!todosListos || enviando}
          >
            {enviando ? 'Enviando...' : (todosListos ? 'Enviar Pedido a Cocina' : 'Esperando a los demás...')}
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
