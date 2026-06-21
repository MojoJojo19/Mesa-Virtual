const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

// ─── Datos mock de fallback (cuando el backend no está activo) ───
export const MOCK_PLATOS = [
  {
    id_producto: 1, nombre: 'Pollo a la brasa 1/4', icon: '🍗',
    descripcion: 'Con papas fritas y ensalada', precio: '18.00', id_categoria: 1
  },
  {
    id_producto: 2, nombre: 'Pollo a la brasa 1/2', icon: '🍗',
    descripcion: 'Con papas fritas y ensalada', precio: '32.00', id_categoria: 1
  },
  {
    id_producto: 3, nombre: 'Combo familiar', icon: '🍗',
    descripcion: 'Pollo entero + 4 bebidas + papas', precio: '75.00', id_categoria: 1
  },
  {
    id_producto: 4, nombre: 'Inca Kola 500ml', icon: '🥤',
    descripcion: 'Bebida refrescante', precio: '5.00', id_categoria: 2
  },
  {
    id_producto: 5, nombre: 'Coca-Cola 500ml', icon: '🥤',
    descripcion: 'Bebida refrescante', precio: '5.00', id_categoria: 2
  },
  {
    id_producto: 6, nombre: 'Chicharrón de pollo', icon: '🍟',
    descripcion: 'Entrada crujiente con salsa criolla', precio: '12.00', id_categoria: 3
  },
  {
    id_producto: 7, nombre: 'Papa a la huancaína', icon: '🥔',
    descripcion: 'Entrada clásica peruana', precio: '10.00', id_categoria: 3
  },
  {
    id_producto: 8, nombre: 'Picarones', icon: '🍩',
    descripcion: 'Con miel de chancaca', precio: '8.00', id_categoria: 4
  },
]

export const MOCK_MESA = {
  id_mesa: 7, nombre_restaurante: 'La Fogata Grill',
  capacidad: 4, pin: '7823', estado: 'activa'
}

// ─── Helper para evitar esperas largas si el backend no responde ───
const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 1500, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { ...rest, signal: controller.signal });
  clearTimeout(id);
  return response;
};

// ─── API calls ───────────────────────────────────────────────────
export const getPlatos = async () => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/productos/`)
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch {
    console.warn('Backend no disponible, usando datos mock')
    return MOCK_PLATOS
  }
}

export const getCategorias = async () => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/categorias/`)
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch {
    return [
      { id_categoria: 1, nombre: 'Pollos' },
      { id_categoria: 2, nombre: 'Bebidas' },
      { id_categoria: 3, nombre: 'Entradas' },
      { id_categoria: 4, nombre: 'Postres' }
    ]
  }
}

export const getMesa = async (idMesa) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/mesas/${idMesa}/`)
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch {
    return { ...MOCK_MESA, id_mesa: idMesa }
  }
}

export const crearComensal = async (nombre, avatar, idMesa) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/comensales/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, avatar, id_mesa: parseInt(idMesa) })
    })
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch {
    // Fallback: simular creación exitosa
    return { id_comensal: Date.now(), nombre, avatar, id_mesa: parseInt(idMesa) }
  }
}

export const enviarPedido = async (idMesa, items) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/pedidos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_mesa: parseInt(idMesa), items })
    })
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch {
    return { id_pedido: Date.now(), estado: 'en_preparacion' }
  }
}

export const llamarMesero = async (idMesa) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/alertas/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_mesa: parseInt(idMesa), tipo: 'llamar_mesero' })
    })
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch {
    return { ok: true }
  }
}
