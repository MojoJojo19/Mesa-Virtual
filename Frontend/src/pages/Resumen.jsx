import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Smartphone, CreditCard, Banknote, Info, X } from 'lucide-react'
import { pedirCuenta, getComensalesDeMesa, getPedidosDeMesa } from '../services/api'
import { useToast } from '../components/Toast'
import TopBar from '../components/TopBar'

const METODOS = [
  { id: 'yape',     label: 'Yape / Plin', icono: Smartphone },
  { id: 'tarjeta',  label: 'Tarjeta',     icono: CreditCard },
  { id: 'efectivo', label: 'Efectivo',    icono: Banknote }
]

const PROPINAS = [0, 0.05, 0.10, 0.15]

export default function Resumen() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{}')
  const miCarrito = JSON.parse(localStorage.getItem('swifttable_carrito') || '[]')
  const modoPago = user.modoPago || 'individual'

  const [metodoPago, setMetodoPago] = useState('yape')
  const [propinaIdx, setPropinaIdx] = useState(1)
  const [solicitando, setSolicitando] = useState(false)
  const [hojaPago, setHojaPago] = useState(false)

  const [comensales, setComensales] = useState([])
  const [pedidos, setPedidos] = useState([])

  useEffect(() => {
    let vivo = true
    Promise.all([getComensalesDeMesa(idMesa), getPedidosDeMesa(idMesa)]).then(([lista, peds]) => {
      if (!vivo) return
      setComensales(lista.filter(c => c.estado_sesion !== 'inactiva'))
      setPedidos(peds || [])
    })
    return () => { vivo = false }
  }, [idMesa])

  const sumar = (items) => items.reduce((s, i) => s + Number(i.precio || 0) * (i.cantidad || 1), 0)

  const misEnviados = pedidos.filter(p => p.id_comensal === user.id).flatMap(p => p.items || [])
  const misItems = [...misEnviados, ...miCarrito]
  const miConsumo = sumar(misItems)
  const totalMesa = sumar(pedidos.flatMap(p => p.items || [])) + sumar(miCarrito)
  const personas = comensales.length || 1

  /* Lo que te toca depende del modo que eligió la mesa. */
  let subtotal = miConsumo
  let explicacion = `Tu consumo (${misItems.length} ${misItems.length === 1 ? 'plato' : 'platos'})`

  if (modoPago === 'partes_iguales') {
    subtotal = totalMesa / personas
    explicacion = `Tu parte (1 de ${personas})`
  } else if (modoPago === 'lider' && user.isLider) {
    subtotal = totalMesa
    explicacion = 'Toda la mesa (tú invitas)'
  } else if (modoPago === 'lider') {
    subtotal = 0
    explicacion = 'Invita el anfitrión'
  }

  const servicio = subtotal * 0.10
  const pctPropina = PROPINAS[propinaIdx]
  const propinaMonto = subtotal * pctPropina
  const totalFinal = subtotal + servicio + propinaMonto

  const handlePedirBoleta = async () => {
    setSolicitando(true)
    try {
      await pedirCuenta(idMesa)
      toast('El mozo traerá la boleta a su mesa.', 'success')
    } catch (e) {
      toast('No pudimos avisar al mozo', 'error')
    } finally {
      setSolicitando(false)
    }
  }

  /* Reemplaza al alert() nativo: confirma y avisa al mozo de verdad. */
  const confirmarPago = async () => {
    setHojaPago(false)
    const metodo = METODOS.find(m => m.id === metodoPago)
    try {
      await pedirCuenta(idMesa)
      toast(`Listo: el mozo viene a cobrar con ${metodo.label}.`, 'success')
    } catch (e) {
      toast('No pudimos avisar al mozo', 'error')
    }
  }

  return (
    <div className="st-screen st-screen--light">
      <div className="st-darkhead" style={{ paddingBottom: 22 }}>
        <TopBar meta={`Mesa ${idMesa} · Tu parte`} onBack={() => navigate(-1)} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', paddingTop: 18 }}>
          <span className="st-label">Total a pagar</span>
          <span className="st-num" style={{ fontSize: 52, color: 'var(--st-lime)' }}>
            S/ {totalFinal.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="st-body" style={{ padding: '18px 18px 0', gap: 14 }}>
        <div className="st-bill">
          <div className="st-bill__row"><span>{explicacion}</span><b>S/ {subtotal.toFixed(2)}</b></div>
          <div className="st-bill__row"><span>Servicio 10%</span><b>S/ {servicio.toFixed(2)}</b></div>
          {propinaMonto > 0 && (
            <div className="st-bill__row">
              <span>Propina {(pctPropina * 100).toFixed(0)}%</span>
              <b>S/ {propinaMonto.toFixed(2)}</b>
            </div>
          )}
          <div className="st-bill__rule" />
          <div className="st-bill__row" style={{ alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 19, color: 'var(--st-dark-1)' }}>Total</span>
            <span className="st-num" style={{ fontSize: 22, color: 'var(--st-dark-1)' }}>S/ {totalFinal.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div className="st-label">Propina para la cocina</div>
          <div className="st-tips" role="radiogroup" aria-label="Propina">
            {PROPINAS.map((val, idx) => (
              <button
                key={val}
                role="radio"
                aria-checked={propinaIdx === idx}
                className={`st-tip ${propinaIdx === idx ? 'st-tip--on' : ''}`}
                onClick={() => setPropinaIdx(idx)}
              >
                {val * 100}%
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div className="st-label">Cómo pagas</div>
          <div className="st-pays" role="radiogroup" aria-label="Método de pago">
            {METODOS.map(m => {
              const Icono = m.icono
              const activo = metodoPago === m.id
              return (
                <button
                  key={m.id}
                  role="radio"
                  aria-checked={activo}
                  className={`st-pay ${activo ? 'st-pay--on' : ''}`}
                  onClick={() => setMetodoPago(m.id)}
                >
                  <Icono size={22} strokeWidth={2.2} color={activo ? '#fff' : 'var(--st-dark-3)'} />
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {personas > 1 && modoPago !== 'lider' && (
          <div
            className="st-note"
            style={{ background: 'rgba(184,241,78,0.28)', border: '2px solid var(--st-lime)', color: '#3f5514' }}
          >
            <Info size={19} strokeWidth={2.4} color="#4f6b18" style={{ flexShrink: 0 }} />
            <span>
              {personas - 1 === 1 ? 'La otra persona paga' : `Las otras ${personas - 1} personas pagan`} su parte por
              separado. La mesa se cierra cuando todos terminen.
            </span>
          </div>
        )}
      </div>

      <div className="st-dock" style={{ flexDirection: 'column', gap: 9, alignItems: 'stretch' }}>
        <button
          className="st-btn st-btn--primary st-btn--sm"
          onClick={() => setHojaPago(true)}
          disabled={totalFinal <= 0}
        >
          Pagar S/ {totalFinal.toFixed(2)}
        </button>
        <button className="st-btn st-btn--outline" onClick={handlePedirBoleta} disabled={solicitando}>
          {solicitando ? 'Avisando…' : 'Que el mozo traiga la boleta'}
        </button>
      </div>

      {hojaPago && (
        <div className="st-sheet-backdrop" onClick={() => setHojaPago(false)} role="dialog" aria-modal="true">
          <div className="st-sheet" onClick={e => e.stopPropagation()}>
            <div className="st-sheet__grip" />

            <h2 className="st-h2" style={{ fontSize: 24 }}>Confirma tu pago</h2>

            <div className="st-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="st-label">Monto</span>
                <span className="st-num" style={{ fontSize: 28, color: 'var(--st-lime)' }}>S/ {totalFinal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="st-label">Método</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  {METODOS.find(m => m.id === metodoPago).label}
                </span>
              </div>
            </div>

            <p className="st-lead" style={{ fontSize: 14 }}>
              Avisaremos al mozo para que se acerque a cobrar. El pago se completa en la mesa.
            </p>

            <button className="st-btn st-btn--primary st-btn--sm" onClick={confirmarPago}>
              Avisar al mozo
            </button>
            <button className="st-btn st-btn--outline" onClick={() => setHojaPago(false)}>
              <X size={16} strokeWidth={2.6} style={{ verticalAlign: '-3px', marginRight: 6 }} />
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
