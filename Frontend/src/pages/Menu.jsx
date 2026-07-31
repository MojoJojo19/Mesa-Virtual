import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bell, Utensils, Scroll, Snowflake, HandPlatter, Sparkles, X, Trash2 } from 'lucide-react'
import { getPlatos, getCategorias, llamarMesero, getMesa } from '../services/api'
import { useToast } from '../components/Toast'
import TopBar from '../components/TopBar'

const MODOS_PAGO_TEXTO = {
  individual: 'Cada uno lo suyo',
  partes_iguales: 'Partes iguales',
  lider: 'Tú invitas'
}

const AYUDAS = [
  { id: 'llamar_mesero',     label: 'Llamado general',   desc: 'Necesitamos consultar algo',   icono: HandPlatter },
  { id: 'traer_cubiertos',   label: 'Traer cubiertos',   desc: 'Tenedor, cuchillo o cuchara',  icono: Utensils },
  { id: 'traer_servilletas', label: 'Traer servilletas', desc: 'Servilletas para la mesa',     icono: Scroll },
  { id: 'traer_hielo',       label: 'Traer hielo',       desc: 'Un vaso o cubeta con hielo',   icono: Snowflake },
  { id: 'retirar_platos',    label: 'Retirar platos',    desc: 'Despejar espacio en la mesa',  icono: Sparkles }
]

export default function Menu() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const user = JSON.parse(localStorage.getItem('swifttable_user') || '{}')

  const [carrito, setCarrito] = useState([])
  const [platos, setPlatos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoria, setCategoria] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [hojaAyuda, setHojaAyuda] = useState(false)

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        let restId = null
        try {
          const mesaInfo = await getMesa(idMesa)
          if (mesaInfo && mesaInfo.id_restaurante) restId = mesaInfo.id_restaurante
        } catch (err) {
          console.error('Error al obtener la mesa:', err)
        }

        const [platosData, catsData] = await Promise.all([
          getPlatos(restId),
          getCategorias(restId)
        ])
        setPlatos(platosData || [])
        setCategorias(catsData || [])
        if (catsData && catsData.length > 0) setCategoria(catsData[0].id_categoria)
      } catch (e) {
        toast('No pudimos cargar el menú', 'error')
      } finally {
        setCargando(false)
      }
    }
    fetchDatos()
  }, [idMesa, toast])

  useEffect(() => {
    const prevCart = localStorage.getItem('swifttable_carrito')
    if (prevCart) setCarrito(JSON.parse(prevCart))
  }, [])

  const enviarAlertaMozo = async (tipo, etiqueta) => {
    setHojaAyuda(false)
    try {
      await llamarMesero(idMesa, tipo)
      toast(`${etiqueta}: el mozo va en camino`, 'success')
    } catch (e) {
      toast('No pudimos avisar al mozo', 'error')
    }
  }

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

  const vaciarCarrito = () => {
    setCarrito([])
    localStorage.removeItem('swifttable_carrito')
    toast('Vaciaste tu pedido', 'info')
  }

  const platosFiltrados = platos.filter(p => p.id_categoria === categoria)
  const totalItems = carrito.reduce((sum, p) => sum + p.cantidad, 0)
  const totalMonto = carrito.reduce((sum, p) => sum + (Number(p.precio || 0) * p.cantidad), 0)

  return (
    <div className="st-screen st-screen--light">
      <div className="st-darkhead">
        <TopBar
          meta={`Mesa ${idMesa}${user.modoPago ? ` · ${MODOS_PAGO_TEXTO[user.modoPago] || ''}` : ''}`}
          derecha={
            <>
              {totalItems > 0 && (
                <button className="st-back" onClick={vaciarCarrito} aria-label="Vaciar mi pedido">
                  <Trash2 size={17} strokeWidth={2.2} color="var(--st-text-2)" />
                </button>
              )}
              <button
                className="st-back"
                style={{ background: 'var(--st-amber)' }}
                onClick={() => setHojaAyuda(true)}
                aria-label="Llamar al mozo"
              >
                <Bell size={18} strokeWidth={2.4} color="var(--st-ink)" />
              </button>
            </>
          }
        />

        <div className="st-cats" role="tablist" aria-label="Categorías del menú">
          {categorias.map(cat => (
            <button
              key={cat.id_categoria}
              role="tab"
              aria-selected={categoria === cat.id_categoria}
              className={`st-cat ${categoria === cat.id_categoria ? 'st-cat--on' : ''}`}
              onClick={() => setCategoria(cat.id_categoria)}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="st-body" style={{ padding: '16px 18px 0', gap: 11 }}>
        {cargando ? (
          <div className="st-empty">Cargando el menú…</div>
        ) : platosFiltrados.length === 0 ? (
          <div className="st-empty">No hay platos en esta categoría.</div>
        ) : (
          platosFiltrados.map(plato => {
            const cant = getCantidad(plato.id_producto)
            const agotado = plato.disponible === false

            return (
              <div
                key={plato.id_producto}
                className={`st-dish ${cant > 0 ? 'st-dish--in' : ''} ${agotado ? 'st-dish--off' : ''}`}
              >
                <div className="st-dish__thumb">
                  {plato.imagen_url
                    ? <img src={plato.imagen_url} alt="" />
                    : <span className="st-dish__ph">FOTO<br />PLATO</span>}
                </div>

                <div className="st-dish__info">
                  <div className="st-dish__name">{plato.nombre}</div>
                  {plato.descripcion && <div className="st-dish__desc">{plato.descripcion}</div>}
                  {agotado
                    ? <div className="st-dish__desc">Agotado por hoy</div>
                    : <div className="st-dish__price">S/ {Number(plato.precio || 0).toFixed(2)}</div>}
                </div>

                {!agotado && (
                  cant > 0 ? (
                    <div className="st-qty">
                      <button
                        className="st-qty__btn st-qty__btn--plus"
                        onClick={() => aumentar(plato)}
                        aria-label={`Agregar otro ${plato.nombre}`}
                      >
                        +
                      </button>
                      <span className="st-qty__n">{cant}</span>
                      <button
                        className="st-qty__btn st-qty__btn--minus"
                        onClick={() => disminuir(plato)}
                        aria-label={`Quitar un ${plato.nombre}`}
                      >
                        –
                      </button>
                    </div>
                  ) : (
                    <button className="st-add" onClick={() => aumentar(plato)}>Agregar</button>
                  )
                )}
              </div>
            )
          })
        )}
      </div>

      {totalItems > 0 && (
        <div className="st-dock">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="st-label">{totalItems} {totalItems === 1 ? 'PLATO' : 'PLATOS'}</span>
            <span className="st-num" style={{ fontSize: 24, color: '#fff' }}>S/ {totalMonto.toFixed(2)}</span>
          </div>
          <button className="st-btn st-btn--primary st-btn--sm" style={{ flex: 1 }} onClick={handleConfirmar}>
            Ver pedido de la mesa
          </button>
        </div>
      )}

      {hojaAyuda && (
        <div className="st-sheet-backdrop" onClick={() => setHojaAyuda(false)} role="dialog" aria-modal="true">
          <div className="st-sheet" onClick={e => e.stopPropagation()}>
            <div className="st-sheet__grip" />
            <h2 className="st-h2" style={{ fontSize: 24 }}>¿Qué necesitan?</h2>

            {AYUDAS.map(op => {
              const Icono = op.icono
              return (
                <button key={op.id} className="st-sheet__item" onClick={() => enviarAlertaMozo(op.id, op.label)}>
                  <span
                    className="st-tile"
                    style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--st-bg)', color: 'var(--st-amber)' }}
                  >
                    <Icono size={19} strokeWidth={2.2} />
                  </span>
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 16 }}>{op.label}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--st-text-3)', fontWeight: 500 }}>{op.desc}</span>
                  </span>
                </button>
              )
            })}

            <button className="st-btn st-btn--outline" onClick={() => setHojaAyuda(false)}>
              <X size={16} strokeWidth={2.6} style={{ verticalAlign: '-3px', marginRight: 6 }} />
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
