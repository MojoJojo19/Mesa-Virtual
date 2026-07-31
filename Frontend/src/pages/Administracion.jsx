import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Plus, X, QrCode, Printer, Trash2, Pencil, Check,
  LayoutGrid, UtensilsCrossed, UserCog, RefreshCw
} from 'lucide-react'
import {
  getMesasGestion, crearMesa,
  getCategorias, crearCategoria, eliminarCategoria,
  getProductosGestion, crearProducto, actualizarProducto, desactivarProducto,
  getUsuarios, crearUsuario, desactivarUsuario,
  cerrarSesionStaff, BACKEND_ORIGIN
} from '../services/api'
import { useToast } from '../components/Toast'

const SECCIONES = [
  { id: 'mesas',     label: 'Mesas',    icono: LayoutGrid },
  { id: 'carta',     label: 'Carta',    icono: UtensilsCrossed },
  { id: 'personal',  label: 'Personal', icono: UserCog }
]

const ROLES = ['admin', 'mesero', 'cocinero']

export default function Administracion() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const idRestaurante = parseInt(localStorage.getItem('swifttable_id_restaurante')) || null
  const nombreRestaurante = localStorage.getItem('swifttable_nombre_restaurante') || 'SwiftTable'

  const [seccion, setSeccion] = useState('mesas')
  const [cargando, setCargando] = useState(true)

  const [mesas, setMesas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [usuarios, setUsuarios] = useState([])

  const [mesaQr, setMesaQr] = useState(null)
  const [editandoProducto, setEditandoProducto] = useState(null)

  /* Una sola carga para las tres secciones: son pocas filas y así cambiar de
     pestaña es instantáneo. */
  const cargarTodo = useCallback(async (avisar = false) => {
    setCargando(true)
    try {
      const [ms, cs, ps, us] = await Promise.all([
        getMesasGestion(),
        getCategorias(idRestaurante),
        getProductosGestion(idRestaurante),
        getUsuarios()
      ])
      setMesas(ms || [])
      setCategorias(cs || [])
      setProductos(ps || [])
      setUsuarios(us || [])
      if (avisar) toast('Datos actualizados', 'success')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setCargando(false)
    }
  }, [idRestaurante, toast])

  useEffect(() => { cargarTodo() }, [cargarTodo])

  const handleSalir = () => {
    cerrarSesionStaff()
    navigate('/')
  }

  /* ---------------- Mesas ---------------- */

  const [numeroMesa, setNumeroMesa] = useState('')
  const [creandoMesa, setCreandoMesa] = useState(false)

  const handleCrearMesa = async (e) => {
    e.preventDefault()
    if (creandoMesa) return
    setCreandoMesa(true)
    try {
      const mesa = await crearMesa(numeroMesa)
      setMesas(prev => [...prev, mesa].sort((a, b) => a.numero - b.numero))
      setNumeroMesa('')
      toast(`Mesa ${mesa.numero} creada. Su PIN es ${mesa.pin}.`, 'success')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setCreandoMesa(false)
    }
  }

  const renderMesas = () => (
    <>
      <div className="st-block">
        <div className="st-block__head">
          <h2 className="st-h2" style={{ fontSize: 20 }}>Nueva mesa</h2>
        </div>
        <form onSubmit={handleCrearMesa} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="st-field" style={{ flex: '1 1 180px' }}>
            <label className="st-label" htmlFor="numero-mesa">Número de mesa</label>
            <input
              id="numero-mesa"
              className="st-input"
              type="number"
              min="1"
              placeholder="Ej. 8"
              value={numeroMesa}
              onChange={e => setNumeroMesa(e.target.value)}
              required
            />
          </div>
          <button className="st-act st-act--go" type="submit" disabled={creandoMesa || !numeroMesa}>
            <Plus size={15} strokeWidth={2.6} style={{ verticalAlign: '-2px' }} />{' '}
            {creandoMesa ? 'Creando…' : 'Crear mesa'}
          </button>
        </form>
        <p className="st-label" style={{ marginTop: 10 }}>
          Al crearla se genera su QR y un PIN de 4 dígitos. El PIN cambia cada vez que se libera la mesa.
        </p>
      </div>

      <div className="st-block" style={{ marginTop: 16 }}>
        <div className="st-block__head">
          <h2 className="st-h2" style={{ fontSize: 20 }}>Mesas del local ({mesas.length})</h2>
        </div>

        {mesas.length === 0 ? (
          <div className="st-empty">Todavía no hay mesas. Crea la primera arriba.</div>
        ) : (
          <div className="st-tables">
            {mesas.map(m => (
              <button
                key={m.id_mesa}
                className={`st-mesa ${m.estado === 'ocupada' ? 'st-mesa--ocupada' : 'st-mesa--libre'}`}
                onClick={() => setMesaQr(m)}
                title="Ver el QR de esta mesa"
              >
                <span className="st-mesa__n">M{m.numero}</span>
                <span className="st-mesa__estado" style={{ color: 'var(--st-text-3)' }}>
                  PIN {m.pin || '—'}
                </span>
                <QrCode size={15} strokeWidth={2.2} color="var(--st-text-3)" style={{ marginTop: 4 }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )

  const renderModalQr = () => {
    if (!mesaQr) return null
    return (
      <div className="st-modal-backdrop" onClick={() => setMesaQr(null)} role="dialog" aria-modal="true">
        <div className="st-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
          <div className="st-block__head">
            <h2 className="st-h2" style={{ fontSize: 22 }}>Mesa {mesaQr.numero}</h2>
            <button className="st-back" onClick={() => setMesaQr(null)} aria-label="Cerrar">
              <X size={19} strokeWidth={2.4} />
            </button>
          </div>

          {/* st-print es lo único que sobrevive a @media print. */}
          <div className="st-print" style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 'var(--st-r-md)', display: 'inline-block' }}>
              {mesaQr.codigo_qr ? (
                <img
                  src={`${BACKEND_ORIGIN}${mesaQr.codigo_qr}`}
                  alt={`Código QR de la mesa ${mesaQr.numero}`}
                  style={{ width: 220, height: 220, display: 'block' }}
                />
              ) : (
                <div style={{ width: 220, height: 220, display: 'grid', placeItems: 'center', color: '#666' }}>
                  Sin QR generado
                </div>
              )}
            </div>
            <div style={{ marginTop: 12, fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 22 }}>
              Mesa {mesaQr.numero}
            </div>
            <div className="st-num" style={{ fontSize: 30, letterSpacing: '0.12em' }}>
              PIN {mesaQr.pin || '—'}
            </div>
          </div>

          <button className="st-act st-act--quiet" onClick={() => window.print()}>
            <Printer size={15} strokeWidth={2.4} style={{ verticalAlign: '-2px' }} /> Imprimir
          </button>
        </div>
      </div>
    )
  }

  /* ---------------- Carta ---------------- */

  const [nombreCategoria, setNombreCategoria] = useState('')
  const [formProducto, setFormProducto] = useState({ nombre: '', descripcion: '', precio: '', id_categoria: '' })

  const handleCrearCategoria = async (e) => {
    e.preventDefault()
    try {
      const cat = await crearCategoria(nombreCategoria, null)
      setCategorias(prev => [...prev, cat])
      setNombreCategoria('')
      toast(`Categoría "${cat.nombre}" creada`, 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const handleEliminarCategoria = async (cat) => {
    // El backend borra de verdad la categoría; con productos dentro fallará
    // por la clave foránea, así que lo avisamos antes de intentarlo.
    const enUso = productos.filter(p => p.id_categoria === cat.id_categoria).length
    if (enUso > 0) {
      toast(`"${cat.nombre}" tiene ${enUso} producto(s). Muévelos o retíralos primero.`, 'error')
      return
    }
    try {
      await eliminarCategoria(cat.id_categoria)
      setCategorias(prev => prev.filter(c => c.id_categoria !== cat.id_categoria))
      toast('Categoría eliminada', 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const handleCrearProducto = async (e) => {
    e.preventDefault()
    try {
      const prod = await crearProducto({
        nombre: formProducto.nombre,
        descripcion: formProducto.descripcion || null,
        precio: parseFloat(formProducto.precio),
        id_categoria: parseInt(formProducto.id_categoria)
      })
      setProductos(prev => [...prev, prod])
      setFormProducto({ nombre: '', descripcion: '', precio: '', id_categoria: '' })
      toast(`"${prod.nombre}" añadido a la carta`, 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const handleGuardarProducto = async () => {
    try {
      const prod = await actualizarProducto(editandoProducto.id_producto, {
        nombre: editandoProducto.nombre,
        descripcion: editandoProducto.descripcion || null,
        precio: parseFloat(editandoProducto.precio),
        id_categoria: parseInt(editandoProducto.id_categoria)
      })
      setProductos(prev => prev.map(p => p.id_producto === prod.id_producto ? prod : p))
      setEditandoProducto(null)
      toast('Producto actualizado', 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const handleCambiarDisponibilidad = async (prod) => {
    try {
      if (prod.estado === 'disponible') {
        await desactivarProducto(prod.id_producto)
        setProductos(prev => prev.map(p =>
          p.id_producto === prod.id_producto ? { ...p, estado: 'inactivo' } : p))
        toast(`"${prod.nombre}" retirado de la carta`, 'info')
      } else {
        const actualizado = await actualizarProducto(prod.id_producto, { estado: 'disponible' })
        setProductos(prev => prev.map(p =>
          p.id_producto === prod.id_producto ? actualizado : p))
        toast(`"${prod.nombre}" vuelve a la carta`, 'success')
      }
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const nombreCategoriaDe = (id) =>
    categorias.find(c => c.id_categoria === id)?.nombre || `Categoría #${id}`

  const renderCarta = () => (
    <>
      <div className="st-block">
        <div className="st-block__head">
          <h2 className="st-h2" style={{ fontSize: 20 }}>Categorías ({categorias.length})</h2>
        </div>

        <form onSubmit={handleCrearCategoria} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="st-field" style={{ flex: '1 1 200px' }}>
            <label className="st-label" htmlFor="nombre-categoria">Nombre</label>
            <input
              id="nombre-categoria"
              className="st-input"
              placeholder="Ej. Postres"
              value={nombreCategoria}
              onChange={e => setNombreCategoria(e.target.value)}
              required
            />
          </div>
          <button className="st-act st-act--go" type="submit" disabled={!nombreCategoria.trim()}>
            <Plus size={15} strokeWidth={2.6} style={{ verticalAlign: '-2px' }} /> Añadir
          </button>
        </form>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {categorias.length === 0 ? (
            <span className="st-label">Sin categorías todavía.</span>
          ) : categorias.map(c => (
            <span
              key={c.id_categoria}
              className="st-chip"
              style={{ background: 'var(--st-surface)', color: 'var(--st-text-1)', gap: 8 }}
            >
              {c.nombre}
              <button
                onClick={() => handleEliminarCategoria(c)}
                aria-label={`Eliminar la categoría ${c.nombre}`}
                style={{ background: 'none', border: 'none', color: 'var(--st-text-3)', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <Trash2 size={13} strokeWidth={2.3} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="st-block" style={{ marginTop: 16 }}>
        <div className="st-block__head">
          <h2 className="st-h2" style={{ fontSize: 20 }}>Nuevo producto</h2>
        </div>

        {categorias.length === 0 ? (
          <div className="st-empty">Crea una categoría antes de añadir productos.</div>
        ) : (
          <form onSubmit={handleCrearProducto} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="st-field" style={{ flex: '2 1 200px' }}>
              <label className="st-label" htmlFor="prod-nombre">Nombre</label>
              <input
                id="prod-nombre"
                className="st-input"
                placeholder="Ej. Lomo saltado"
                value={formProducto.nombre}
                onChange={e => setFormProducto({ ...formProducto, nombre: e.target.value })}
                required
              />
            </div>
            <div className="st-field" style={{ flex: '2 1 200px' }}>
              <label className="st-label" htmlFor="prod-desc">Descripción</label>
              <input
                id="prod-desc"
                className="st-input"
                placeholder="Opcional"
                value={formProducto.descripcion}
                onChange={e => setFormProducto({ ...formProducto, descripcion: e.target.value })}
              />
            </div>
            <div className="st-field" style={{ flex: '1 1 110px' }}>
              <label className="st-label" htmlFor="prod-precio">Precio (S/)</label>
              <input
                id="prod-precio"
                className="st-input"
                type="number"
                step="0.10"
                min="0"
                placeholder="0.00"
                value={formProducto.precio}
                onChange={e => setFormProducto({ ...formProducto, precio: e.target.value })}
                required
              />
            </div>
            <div className="st-field" style={{ flex: '1 1 150px' }}>
              <label className="st-label" htmlFor="prod-cat">Categoría</label>
              <select
                id="prod-cat"
                className="st-select"
                value={formProducto.id_categoria}
                onChange={e => setFormProducto({ ...formProducto, id_categoria: e.target.value })}
                required
              >
                <option value="">Elegir…</option>
                {categorias.map(c => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <button className="st-act st-act--go" type="submit">
              <Plus size={15} strokeWidth={2.6} style={{ verticalAlign: '-2px' }} /> Añadir
            </button>
          </form>
        )}
      </div>

      <div className="st-block" style={{ marginTop: 16 }}>
        <div className="st-block__head">
          <h2 className="st-h2" style={{ fontSize: 20 }}>Carta ({productos.length})</h2>
        </div>

        {productos.length === 0 ? (
          <div className="st-empty">La carta está vacía.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {productos.map(p => {
              const editando = editandoProducto?.id_producto === p.id_producto
              const retirado = p.estado !== 'disponible'

              if (editando) {
                return (
                  <div key={p.id_producto} style={{ background: 'var(--st-surface)', borderRadius: 'var(--st-r-sm)', padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="st-field" style={{ flex: '2 1 180px' }}>
                      <label className="st-label">Nombre</label>
                      <input
                        className="st-input"
                        value={editandoProducto.nombre}
                        onChange={e => setEditandoProducto({ ...editandoProducto, nombre: e.target.value })}
                      />
                    </div>
                    <div className="st-field" style={{ flex: '1 1 100px' }}>
                      <label className="st-label">Precio</label>
                      <input
                        className="st-input"
                        type="number"
                        step="0.10"
                        min="0"
                        value={editandoProducto.precio}
                        onChange={e => setEditandoProducto({ ...editandoProducto, precio: e.target.value })}
                      />
                    </div>
                    <div className="st-field" style={{ flex: '1 1 140px' }}>
                      <label className="st-label">Categoría</label>
                      <select
                        className="st-select"
                        value={editandoProducto.id_categoria}
                        onChange={e => setEditandoProducto({ ...editandoProducto, id_categoria: e.target.value })}
                      >
                        {categorias.map(c => (
                          <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <button className="st-act st-act--go st-act--sm" onClick={handleGuardarProducto}>
                      <Check size={14} strokeWidth={2.6} style={{ verticalAlign: '-2px' }} /> Guardar
                    </button>
                    <button className="st-act st-act--quiet st-act--sm" onClick={() => setEditandoProducto(null)}>
                      Cancelar
                    </button>
                  </div>
                )
              }

              return (
                <div
                  key={p.id_producto}
                  className="st-pago"
                  style={{ opacity: retirado ? 0.55 : 1 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 16 }}>
                      {p.nombre} {retirado && <span className="st-label">· RETIRADO</span>}
                    </span>
                    <span className="st-label">
                      {nombreCategoriaDe(p.id_categoria)}
                      {p.descripcion ? ` · ${p.descripcion}` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="st-num" style={{ fontSize: 17, color: 'var(--st-lime)' }}>
                      S/ {Number(p.precio).toFixed(2)}
                    </span>
                    <button
                      className="st-act st-act--quiet st-act--sm"
                      onClick={() => setEditandoProducto({ ...p, precio: String(p.precio) })}
                      aria-label={`Editar ${p.nombre}`}
                    >
                      <Pencil size={13} strokeWidth={2.4} />
                    </button>
                    <button
                      className={`st-act st-act--sm ${retirado ? 'st-act--go' : 'st-act--danger'}`}
                      onClick={() => handleCambiarDisponibilidad(p)}
                    >
                      {retirado ? 'Reactivar' : 'Retirar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )

  /* ---------------- Personal ---------------- */

  const [formUsuario, setFormUsuario] = useState({ nombre: '', correo: '', contrasena: '', rol: 'mesero' })

  const handleCrearUsuario = async (e) => {
    e.preventDefault()
    try {
      const usuario = await crearUsuario({ ...formUsuario, id_restaurante: idRestaurante })
      setUsuarios(prev => [...prev, usuario])
      setFormUsuario({ nombre: '', correo: '', contrasena: '', rol: 'mesero' })
      toast(`${usuario.nombre} ya puede entrar al panel`, 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const handleDesactivarUsuario = async (u) => {
    try {
      await desactivarUsuario(u.id_usuario)
      setUsuarios(prev => prev.map(x =>
        x.id_usuario === u.id_usuario ? { ...x, estado: 'inactivo' } : x))
      toast(`${u.nombre} ya no puede entrar`, 'info')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const renderPersonal = () => (
    <>
      <div className="st-block">
        <div className="st-block__head">
          <h2 className="st-h2" style={{ fontSize: 20 }}>Nuevo integrante</h2>
        </div>

        <form onSubmit={handleCrearUsuario} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="st-field" style={{ flex: '1 1 160px' }}>
            <label className="st-label" htmlFor="u-nombre">Nombre</label>
            <input
              id="u-nombre"
              className="st-input"
              value={formUsuario.nombre}
              onChange={e => setFormUsuario({ ...formUsuario, nombre: e.target.value })}
              required
            />
          </div>
          <div className="st-field" style={{ flex: '2 1 200px' }}>
            <label className="st-label" htmlFor="u-correo">Correo</label>
            <input
              id="u-correo"
              className="st-input"
              type="email"
              value={formUsuario.correo}
              onChange={e => setFormUsuario({ ...formUsuario, correo: e.target.value })}
              required
            />
          </div>
          <div className="st-field" style={{ flex: '1 1 150px' }}>
            <label className="st-label" htmlFor="u-pass">Contraseña</label>
            <input
              id="u-pass"
              className="st-input"
              type="password"
              autoComplete="new-password"
              value={formUsuario.contrasena}
              onChange={e => setFormUsuario({ ...formUsuario, contrasena: e.target.value })}
              required
            />
          </div>
          <div className="st-field" style={{ flex: '1 1 120px' }}>
            <label className="st-label" htmlFor="u-rol">Rol</label>
            <select
              id="u-rol"
              className="st-select"
              value={formUsuario.rol}
              onChange={e => setFormUsuario({ ...formUsuario, rol: e.target.value })}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button className="st-act st-act--go" type="submit">
            <Plus size={15} strokeWidth={2.6} style={{ verticalAlign: '-2px' }} /> Crear
          </button>
        </form>
        <p className="st-label" style={{ marginTop: 10 }}>
          La contraseña se guarda cifrada. Con ella entra al panel desde la portada.
        </p>
      </div>

      <div className="st-block" style={{ marginTop: 16 }}>
        <div className="st-block__head">
          <h2 className="st-h2" style={{ fontSize: 20 }}>Personal ({usuarios.length})</h2>
        </div>

        {usuarios.length === 0 ? (
          <div className="st-empty">No hay personal registrado.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {usuarios.map(u => {
              const inactivo = u.estado !== 'activo'
              return (
                <div key={u.id_usuario} className="st-pago" style={{ opacity: inactivo ? 0.55 : 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--st-display)', fontWeight: 800, fontSize: 16 }}>
                      {u.nombre} {inactivo && <span className="st-label">· INACTIVO</span>}
                    </span>
                    <span className="st-label">{u.correo}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="st-chip" style={{ background: 'var(--st-surface)', color: 'var(--st-text-1)' }}>
                      {String(u.rol).toUpperCase()}
                    </span>
                    {!inactivo && (
                      <button className="st-act st-act--danger st-act--sm" onClick={() => handleDesactivarUsuario(u)}>
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )

  /* ---------------- Página ---------------- */

  return (
    <div className="st-panel">
      <header className="st-panel__bar">
        <button className="st-back" onClick={() => navigate('/logistica')} aria-label="Volver al panel de operaciones">
          <ChevronLeft size={22} strokeWidth={2.6} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
          <span className="st-topbar__name" style={{ fontSize: 19 }}>{nombreRestaurante}</span>
          <span className="st-topbar__meta">Administración</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="st-back" onClick={() => cargarTodo(true)} aria-label="Actualizar datos">
            <RefreshCw size={18} strokeWidth={2.2} className={cargando ? 'animate-spin' : ''} />
          </button>
          <button className="st-back" onClick={handleSalir} aria-label="Cerrar sesión">
            <X size={19} strokeWidth={2.4} />
          </button>
        </div>

        <div className="st-tabs" style={{ flex: '1 1 340px' }}>
          {SECCIONES.map(s => {
            const Icono = s.icono
            return (
              <button
                key={s.id}
                className={`st-tab ${seccion === s.id ? 'st-tab--on' : ''}`}
                onClick={() => setSeccion(s.id)}
                aria-pressed={seccion === s.id}
              >
                <Icono size={16} strokeWidth={2.3} /> {s.label}
              </button>
            )
          })}
        </div>
      </header>

      <main className="st-panel__main">
        {cargando && mesas.length === 0 ? (
          <div className="st-empty">Cargando…</div>
        ) : seccion === 'mesas' ? renderMesas()
          : seccion === 'carta' ? renderCarta()
          : renderPersonal()}
      </main>

      {renderModalQr()}
    </div>
  )
}
