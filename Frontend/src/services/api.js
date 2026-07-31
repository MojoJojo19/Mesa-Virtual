const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Adaptador automático para emulador Android (10.0.2.2) o pruebas en red local (192.168.x.x)
  if (window.location.hostname === '10.0.2.2' || window.location.hostname.startsWith('192.168.')) {
    return `http://${window.location.hostname}:8000/api`;
  }
  return 'http://127.0.0.1:8000/api';
};
const API_URL = getApiUrl();

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

// ─── Sesión del personal ─────────────────────────────────────────
/* El panel se abría con un PIN cableado en SelectorRol.jsx (1234 / 4321).
   Ahora la sesión sale de POST /api/auth/login y vive aquí. */

const CLAVE_SESION = 'swifttable_sesion_staff';

export const getSesionStaff = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
  } catch {
    return null;
  }
};

export const haySesionStaff = () => Boolean(getSesionStaff()?.access_token);

/** Cabecera Bearer para los endpoints protegidos; vacía si no hay sesión. */
export const authHeaders = () => {
  const sesion = getSesionStaff();
  return sesion?.access_token ? { Authorization: `Bearer ${sesion.access_token}` } : {};
};

export const cerrarSesionStaff = () => {
  localStorage.removeItem(CLAVE_SESION);
  localStorage.removeItem('swifttable_id_restaurante');
  localStorage.removeItem('swifttable_nombre_restaurante');
};

/**
 * Corta la sesión cuando el backend responde 401.
 *
 * Importa por el patrón de esta capa: cada llamada cae a datos mock si algo
 * falla, así que un token vencido (dura 60 min) habría llenado el panel de
 * cifras inventadas sin avisar. Mejor devolver al login.
 */
const verificarSesion = (res) => {
  if (res.status !== 401) return;
  cerrarSesionStaff();
  if (window.location.pathname.startsWith('/logistica')) window.location.replace('/');
  throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
};

/**
 * Login real del personal contra el backend.
 *
 * A diferencia del resto de llamadas, esta NO tiene respaldo mock a propósito:
 * un fallback local sería otra vez un PIN cableado. Sin backend no se entra al
 * panel. El endpoint usa OAuth2PasswordRequestForm, así que espera el cuerpo
 * como formulario (username / password), no como JSON.
 */
export const loginStaff = async (correo, contrasena) => {
  const cuerpo = new URLSearchParams();
  cuerpo.append('username', correo);
  cuerpo.append('password', contrasena);

  let res;
  try {
    res = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: cuerpo.toString(),
      timeout: 8000
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está encendido el backend?');
  }

  if (res.status === 401) throw new Error('Correo o contraseña incorrectos.');
  if (!res.ok) throw new Error('No se pudo iniciar sesión. Inténtalo de nuevo.');

  const sesion = await res.json();
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  // El resto del panel sigue leyendo estas dos claves.
  localStorage.setItem('swifttable_id_restaurante', String(sesion.id_restaurante));
  localStorage.setItem('swifttable_nombre_restaurante', sesion.nombre_restaurante || 'SwiftTable');
  return sesion;
};

// ─── Administración ──────────────────────────────────────────────
/* Todo esto es del panel de administración y exige token. A diferencia del
   resto del archivo NO cae a datos mock: en administración, un fallback
   silencioso haría creer que se guardó algo que nunca se guardó. */

/** Origen del backend, sin el sufijo /api. Sirve para las imágenes de QR. */
export const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const pedirAdmin = async (ruta, opciones = {}) => {
  const { cuerpo, method = 'GET', ...resto } = opciones;
  let res;
  try {
    res = await fetchWithTimeout(`${API_URL}${ruta}`, {
      method,
      headers: {
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders()
      },
      ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
      timeout: 8000,
      ...resto
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }

  verificarSesion(res);
  if (!res.ok) {
    const detalle = await res.json().catch(() => ({}));
    throw new Error(detalle.detail || 'La operación no se pudo completar.');
  }
  return res.status === 204 ? null : res.json();
};

// Mesas. El listado de gestión trae PIN y QR; el público los oculta.
export const getMesasGestion   = () => pedirAdmin('/mesas/gestion');
export const crearMesa         = (numero) => pedirAdmin('/mesas/', { method: 'POST', cuerpo: { numero: parseInt(numero) } });

// Categorías
export const crearCategoria    = (nombre, descripcion) =>
  pedirAdmin('/categorias/', { method: 'POST', cuerpo: { nombre, descripcion: descripcion || null } });
export const eliminarCategoria = (id) => pedirAdmin(`/categorias/${id}`, { method: 'DELETE' });

// Productos. `incluir_inactivos` deja ver los retirados para reactivarlos.
export const getProductosGestion = (idRestaurante) =>
  pedirAdmin(`/productos/?incluir_inactivos=true${idRestaurante ? `&id_restaurante=${idRestaurante}` : ''}`);
export const crearProducto     = (datos) => pedirAdmin('/productos/', { method: 'POST', cuerpo: datos });
export const actualizarProducto = (id, datos) => pedirAdmin(`/productos/${id}`, { method: 'PUT', cuerpo: datos });
export const desactivarProducto = (id) => pedirAdmin(`/productos/${id}`, { method: 'DELETE' });

// Usuarios (personal del local)
export const getUsuarios       = () => pedirAdmin('/usuarios/');
export const crearUsuario      = (datos) => pedirAdmin('/usuarios/', { method: 'POST', cuerpo: datos });
export const desactivarUsuario = (id) => pedirAdmin(`/usuarios/${id}`, { method: 'DELETE' });

// ─── API calls ───────────────────────────────────────────────────
export const getPlatos = async (idRestaurante = null) => {
  try {
    const url = idRestaurante ? `${API_URL}/productos/?id_restaurante=${idRestaurante}` : `${API_URL}/productos/`
    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch {
    console.warn('Backend no disponible, usando datos mock')
    return MOCK_PLATOS
  }
}

export const getCategorias = async (idRestaurante = null) => {
  try {
    const url = idRestaurante ? `${API_URL}/categorias/?id_restaurante=${idRestaurante}` : `${API_URL}/categorias/`
    const res = await fetchWithTimeout(url)
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

/**
 * Comensales realmente unidos a la mesa. Alimenta el Lobby y el pedido
 * grupal, en lugar de la lista mock que había cableada en el componente.
 */
export const getComensalesDeMesa = async (idMesa) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/mesas/${idMesa}/comensales`)
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch {
    // Sin backend solo conocemos al comensal de este dispositivo.
    try {
      const propio = JSON.parse(localStorage.getItem('swifttable_user') || 'null')
      if (propio && propio.nombre) {
        return [{
          id_comensal: propio.id,
          nombre: propio.nombre,
          avatar: propio.avatar,
          estado_sesion: 'activa',
          id_mesa: parseInt(idMesa)
        }]
      }
    } catch { /* localStorage ilegible */ }
    return []
  }
}

/**
 * Marca la sesión del comensal como inactiva y borra su rastro local.
 *
 * El endpoint existía desde el principio pero nadie lo llamaba: un comensal
 * no tenía forma de salir de la mesa por su cuenta, había que esperar a que
 * el personal la liberara. No se borra el comensal (rompería el historial de
 * sus pedidos), solo se cierra su sesión.
 */
export const cerrarSesionComensal = async (idComensal) => {
  try {
    if (idComensal) {
      await fetchWithTimeout(`${API_URL}/comensales/${idComensal}/cerrar-sesion`, {
        method: 'PUT'
      });
    }
  } catch {
    // Sin backend igual limpiamos el dispositivo: es lo que ve el comensal.
    console.warn('Backend no disponible: la sesión solo se cerró localmente');
  } finally {
    localStorage.removeItem('swifttable_user');
    localStorage.removeItem('swifttable_carrito');
  }
  return { id_comensal: idComensal, estado_sesion: 'inactiva' };
};

export const validarPin = async (idMesa, pin) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/mesas/${idMesa}/validar-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    })
    if (!res.ok) throw new Error('Error')
    const data = await res.json()
    return data.valido
  } catch {
    const mockMesas = getMockMesasLocales()
    const mesa = mockMesas.find(m => m.id_mesa === parseInt(idMesa))
    return mesa ? mesa.pin === pin : false
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

/**
 * Manda el pedido a cocina.
 *
 * El backend lo modela en dos pasos: primero la cabecera del pedido y
 * después una línea por producto. Antes se enviaba todo junto en un solo
 * POST con un campo `items` que el esquema PedidoCreate ni siquiera acepta,
 * así que el pedido nunca llegaba a la cocina.
 */
export const enviarPedido = async (idMesa, items, idComensal = null) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/pedidos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_mesa: parseInt(idMesa),
        id_comensal: idComensal ? parseInt(idComensal) : null
      })
    })
    if (!res.ok) throw new Error('No se pudo crear el pedido')
    const pedido = await res.json()

    // Cada plato del carrito es un detalle. El backend toma el precio del
    // producto, así que aquí solo viajan producto y cantidad.
    const lineas = await Promise.all(items.map(async (it) => {
      try {
        const dRes = await fetchWithTimeout(`${API_URL}/detalles_pedido/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_pedido: pedido.id_pedido,
            id_producto: it.id_producto,
            cantidad: it.cantidad
          })
        })
        return dRes.ok
      } catch {
        return false
      }
    }))

    const fallidas = lineas.filter(ok => !ok).length
    if (fallidas > 0) {
      console.warn(`${fallidas} de ${items.length} platos no se registraron en el pedido ${pedido.id_pedido}`)
    }

    return { ...pedido, itemsFallidos: fallidas }
  } catch (e) {
    console.warn('Backend no disponible, guardando el pedido en local:', e)
    return guardarMockPedidoLocal(idMesa, items, idComensal)
  }
}

/* Sin backend, el pedido se registra en el mock local para que cocina y caja
   sigan mostrando algo coherente durante la demostración. */
const guardarMockPedidoLocal = (idMesa, items, idComensal) => {
  const pedido = {
    id_pedido: Date.now(),
    id_mesa: parseInt(idMesa),
    id_comensal: idComensal || null,
    estado: 'pendiente',
    fecha_hora: new Date().toISOString(),
    items: items.map(it => ({
      nombre: it.nombre,
      cantidad: it.cantidad,
      precio: it.precio
    }))
  }
  try {
    const todos = getMockPedidosLocales()
    const clave = String(idMesa)
    todos[clave] = [...(todos[clave] || []), pedido]
    localStorage.setItem('swifttable_mock_pedidos', JSON.stringify(todos))
  } catch (e) {
    console.error(e)
  }
  return pedido
}

/**
 * Cambia el estado de la mesa (libre / ocupada / por_limpiar).
 * Nada marcaba la mesa como ocupada, así que el mapa del salón mostraba
 * todo libre aunque hubiera gente sentada.
 */
export const actualizarEstadoMesa = async (idMesa, estado) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/mesas/${idMesa}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    })
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch {
    try {
      const mesas = getMockMesasLocales().map(m =>
        m.id_mesa === parseInt(idMesa) ? { ...m, estado } : m
      )
      localStorage.setItem('swifttable_mock_mesas', JSON.stringify(mesas))
    } catch (e) {
      console.error(e)
    }
    return { id_mesa: parseInt(idMesa), estado }
  }
}

// Helper para asistencia simulada local en caso de que falle el backend
const getMockAsistenciasLocales = () => {
  try {
    const val = localStorage.getItem('swifttable_mock_asistencias');
    if (!val) {
      // Un par de llamados de prueba iniciales para que la interfaz no empiece vacía
      const iniciales = [
        { id_asistencia: 101, tipo: 'llamar_mesero', estado: 'pendiente', fecha_hora: new Date(Date.now() - 180000).toISOString(), id_mesa: 3 },
        { id_asistencia: 102, tipo: 'pedir_cuenta', estado: 'pendiente', fecha_hora: new Date(Date.now() - 60000).toISOString(), id_mesa: 5 }
      ];
      localStorage.setItem('swifttable_mock_asistencias', JSON.stringify(iniciales));
      return iniciales;
    }
    return JSON.parse(val);
  } catch {
    return [];
  }
};

const guardarMockAsistenciaLocal = (nueva) => {
  try {
    const actuales = getMockAsistenciasLocales();
    actuales.push(nueva);
    localStorage.setItem('swifttable_mock_asistencias', JSON.stringify(actuales));
  } catch (e) {
    console.error(e);
  }
};

export const llamarMesero = async (idMesa, tipo = 'llamar_mesero') => {
  const payload = { id_mesa: parseInt(idMesa), tipo: tipo };
  try {
    const res = await fetchWithTimeout(`${API_URL}/asistencias/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error');
    const data = await res.json();
    return data;
  } catch {
    const nuevoMock = {
      id_asistencia: Date.now(),
      tipo: tipo,
      estado: 'pendiente',
      fecha_hora: new Date().toISOString(),
      id_mesa: parseInt(idMesa)
    };
    guardarMockAsistenciaLocal(nuevoMock);
    return nuevoMock;
  }
};

export const pedirCuenta = async (idMesa) => {
  const payload = { id_mesa: parseInt(idMesa), tipo: 'pedir_cuenta' };
  try {
    const res = await fetchWithTimeout(`${API_URL}/asistencias/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error');
    const data = await res.json();
    return data;
  } catch {
    const nuevoMock = {
      id_asistencia: Date.now(),
      tipo: 'pedir_cuenta',
      estado: 'pendiente',
      fecha_hora: new Date().toISOString(),
      id_mesa: parseInt(idMesa)
    };
    guardarMockAsistenciaLocal(nuevoMock);
    return nuevoMock;
  }
};

export const getAsistencias = async (idRestaurante = null) => {
  try {
    const url = idRestaurante ? `${API_URL}/asistencias/?id_restaurante=${idRestaurante}` : `${API_URL}/asistencias/`
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch {
    return getMockAsistenciasLocales();
  }
};

export const atenderAsistencia = async (idAsistencia) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/asistencias/${idAsistencia}/atender`, {
      method: 'PUT',
      headers: authHeaders()
    });
    verificarSesion(res);
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch {
    try {
      const actuales = getMockAsistenciasLocales();
      const actualizados = actuales.map(a => 
        a.id_asistencia === idAsistencia ? { ...a, estado: 'atendido' } : a
      );
      localStorage.setItem('swifttable_mock_asistencias', JSON.stringify(actualizados));
    } catch (e) {
      console.error(e);
    }
    return { id_asistencia: idAsistencia, estado: 'atendido' };
  }
};

export const simularLlamadoDesdePanel = (idMesa, tipo) => {
  const nuevoMock = {
    id_asistencia: Date.now(),
    tipo: tipo,
    estado: 'pendiente',
    fecha_hora: new Date().toISOString(),
    id_mesa: parseInt(idMesa)
  };
  guardarMockAsistenciaLocal(nuevoMock);
  return nuevoMock;
};

// Helper para mesas simuladas locales
const getMockMesasLocales = () => {
  try {
    const val = localStorage.getItem('swifttable_mock_mesas');
    if (!val) {
      const iniciales = [
        { id_mesa: 1, numero: 1, estado: 'libre', pin: '1234', comensales: [] },
        { id_mesa: 2, numero: 2, estado: 'libre', pin: '5678', comensales: [] },
        { id_mesa: 3, numero: 3, estado: 'ocupada', pin: '4321', comensales: [{ nombre: 'Juan', avatar: '🐱' }, { nombre: 'María', avatar: '🦊' }] },
        { id_mesa: 4, numero: 4, estado: 'libre', pin: '8765', comensales: [] },
        { id_mesa: 5, numero: 5, estado: 'ocupada', pin: '2468', comensales: [{ nombre: 'Pedro', avatar: '🐶' }] },
        { id_mesa: 6, numero: 6, estado: 'libre', pin: '1357', comensales: [] },
        { id_mesa: 7, numero: 7, estado: 'ocupada', pin: '7823', comensales: [{ nombre: 'Carlos', avatar: '🐱', isLider: true }, { nombre: 'Ana', avatar: '🐶' }] }
      ];
      localStorage.setItem('swifttable_mock_mesas', JSON.stringify(iniciales));
      return iniciales;
    }
    return JSON.parse(val);
  } catch {
    return [];
  }
};

export const getMesas = async (idRestaurante = null) => {
  try {
    // El panel pasa el restaurante activo: sin este filtro un local veía
    // las mesas de todos los demás.
    const url = idRestaurante
      ? `${API_URL}/mesas/?id_restaurante=${idRestaurante}`
      : `${API_URL}/mesas/`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('Error');
    const data = await res.json();
    // Ordenar mesas por número ascendente
    return data.sort((a, b) => a.numero - b.numero);
  } catch {
    return getMockMesasLocales();
  }
};

// Helper para pedidos simulados locales
const getMockPedidosLocales = () => {
  try {
    const val = localStorage.getItem('swifttable_mock_pedidos');
    if (!val) {
      const iniciales = {
        3: [{
          id_pedido: 301,
          estado: 'listo',
          fecha_hora: new Date(Date.now() - 600000).toISOString(),
          id_mesa: 3,
          items: [
            { nombre: 'Pollo a la brasa 1/2', cantidad: 1, precio: '32.00' },
            { nombre: 'Inca Kola 500ml', cantidad: 2, precio: '5.00' }
          ]
        }],
        5: [{
          id_pedido: 501,
          estado: 'en_preparacion',
          fecha_hora: new Date(Date.now() - 300000).toISOString(),
          id_mesa: 5,
          items: [
            { nombre: 'Pollo a la brasa 1/4', cantidad: 1, precio: '18.00' },
            { nombre: 'Chicharrón de pollo', cantidad: 1, precio: '12.00' }
          ]
        }]
      };
      localStorage.setItem('swifttable_mock_pedidos', JSON.stringify(iniciales));
      return iniciales;
    }
    return JSON.parse(val);
  } catch {
    return {};
  }
};

export const liberarMesa = async (idMesa) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/mesas/${idMesa}/liberar`, {
      method: 'POST',
      headers: authHeaders()
    });
    verificarSesion(res);
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch {
    try {
      // 1. Liberar Mesa (estado libre, nuevo PIN, limpiar comensales)
      const actuales = getMockMesasLocales();
      const nuevas = actuales.map(m => {
        if (m.id_mesa === parseInt(idMesa)) {
          return { 
            ...m, 
            estado: 'libre', 
            pin: Math.floor(1000 + Math.random() * 9000).toString(), 
            comensales: [] 
          };
        }
        return m;
      });
      localStorage.setItem('swifttable_mock_mesas', JSON.stringify(nuevas));

      // 2. Marcar pedidos simulados como pagados
      const peds = getMockPedidosLocales();
      if (peds[idMesa]) {
        peds[idMesa] = peds[idMesa].map(p => ({ ...p, estado: 'pagado' }));
        localStorage.setItem('swifttable_mock_pedidos', JSON.stringify(peds));
      }

      // 3. Si se libera la mesa 7 del cliente, vaciar el carrito y reiniciar sesión local del cliente
      if (parseInt(idMesa) === 7) {
        localStorage.removeItem('swifttable_carrito');
        localStorage.removeItem('swifttable_user');
      }

      return nuevas.find(m => m.id_mesa === parseInt(idMesa));
    } catch (e) {
      console.error(e);
    }
    return { id_mesa: idMesa, estado: 'libre', pin: '9999', comensales: [] };
  }
};

export const getPedidosDeMesa = async (idMesa) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/pedidos/mesa/${idMesa}`);
    if (!res.ok) throw new Error('Error');
    const pedidos = await res.json();
    
    const pedidosConDetalles = await Promise.all(pedidos.map(async (ped) => {
      try {
        const dRes = await fetchWithTimeout(`${API_URL}/detalles_pedido/pedido/${ped.id_pedido}`);
        if (dRes.ok) {
          const detalles = await dRes.json();
          const platosList = await fetchWithTimeout(`${API_URL}/productos/`).then(r => r.ok ? r.json() : []);
          const items = detalles.map(d => {
            const prod = platosList.find(p => p.id_producto === d.id_producto);
            return {
              nombre: prod ? prod.nombre : `Producto #${d.id_producto}`,
              cantidad: d.cantidad,
              precio: d.precio_unitario
            };
          });
          return { ...ped, items };
        }
      } catch (e) {
        console.error(e);
      }
      return { ...ped, items: [] };
    }));

    // Retornar solo pedidos ACTIVOS (no pagados ni cancelados) para logística
    return pedidosConDetalles.filter(p => p.estado !== 'pagado' && p.estado !== 'cancelado');
  } catch {
    // Mock fallbacks
    const mockPeds = getMockPedidosLocales();
    const tablePeds = mockPeds[idMesa] || [];

    // Cargar pedido de mesa 7 si está en el carrito local y no ha sido liberada
    if (parseInt(idMesa) === 7) {
      const miCarrito = JSON.parse(localStorage.getItem('swifttable_carrito') || '[]');
      const user = localStorage.getItem('swifttable_user');
      if (miCarrito.length > 0 && user) {
        const yaExisteActivo = tablePeds.some(p => p.estado !== 'pagado' && p.estado !== 'cancelado');
        if (!yaExisteActivo) {
          return [{
            id_pedido: 999,
            estado: 'en_preparacion',
            fecha_hora: new Date().toISOString(),
            id_mesa: 7,
            items: miCarrito.map(c => ({ nombre: c.nombre, cantidad: c.cantidad, precio: c.precio }))
          }];
        }
      }
    }

    // Filtrar solo pedidos activos
    return tablePeds.filter(p => p.estado !== 'pagado' && p.estado !== 'cancelado');
  }
};

export const getPedidosTodos = async (idRestaurante = null) => {
  try {
    const url = idRestaurante ? `${API_URL}/pedidos/?id_restaurante=${idRestaurante}` : `${API_URL}/pedidos/`
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('Error');
    const pedidos = await res.json();
    
    const pedidosConDetalles = await Promise.all(pedidos.map(async (ped) => {
      try {
        const dRes = await fetchWithTimeout(`${API_URL}/detalles_pedido/pedido/${ped.id_pedido}`);
        if (dRes.ok) {
          const detalles = await dRes.json();
          const platosList = await fetchWithTimeout(`${API_URL}/productos/`).then(r => r.ok ? r.json() : []);
          const items = detalles.map(d => {
            const prod = platosList.find(p => p.id_producto === d.id_producto);
            return {
              nombre: prod ? prod.nombre : `Producto #${d.id_producto}`,
              cantidad: d.cantidad,
              precio: d.precio_unitario
            };
          });
          return { ...ped, items };
        }
      } catch (e) {
        console.error(e);
      }
      return { ...ped, items: [] };
    }));
    return pedidosConDetalles;
  } catch {
    const mockPeds = getMockPedidosLocales();
    let todos = [];
    Object.keys(mockPeds).forEach(mesaId => {
      mockPeds[mesaId].forEach(p => {
        todos.push({ ...p, id_mesa: parseInt(mesaId) });
      });
    });
    const miCarrito = JSON.parse(localStorage.getItem('swifttable_carrito') || '[]');
    const user = localStorage.getItem('swifttable_user');
    if (miCarrito.length > 0 && user) {
      const yaExisteActivo = todos.some(p => p.id_mesa === 7 && p.estado !== 'pagado' && p.estado !== 'cancelado');
      if (!yaExisteActivo) {
        todos.push({
          id_pedido: 999,
          estado: 'en_preparacion',
          fecha_hora: new Date().toISOString(),
          id_mesa: 7,
          items: miCarrito.map(c => ({ nombre: c.nombre, cantidad: c.cantidad, precio: c.precio }))
        });
      }
    }
    return todos;
  }
};


export const registrarPago = async (idPedido, montoTotal, propina, metodoPago) => {
  const payload = {
    monto_total: parseFloat(montoTotal),
    propina: propina ? parseFloat(propina) : 0,
    metodo_pago: metodoPago,
    id_pedido: parseInt(idPedido)
  };
  try {
    const res = await fetchWithTimeout(`${API_URL}/pagos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch {
    let items = [];
    let idMesa = 0;
    try {
      const mockPeds = getMockPedidosLocales();
      Object.keys(mockPeds).forEach(mId => {
        const found = mockPeds[mId].find(p => p.id_pedido === parseInt(idPedido));
        if (found) {
          items = found.items || [];
          idMesa = parseInt(mId);
        }
      });
    } catch (err) {}

    const nuevoPago = {
      id_pago: Date.now(),
      id_pedido: parseInt(idPedido),
      id_mesa: idMesa || 7,
      monto_total: parseFloat(montoTotal),
      propina: propina ? parseFloat(propina) : 0,
      metodo_pago: metodoPago,
      fecha_pago: new Date().toISOString(),
      items: items
    };
    try {
      const actuales = JSON.parse(localStorage.getItem('swifttable_mock_pagos') || '[]');
      actuales.push(nuevoPago);
      localStorage.setItem('swifttable_mock_pagos', JSON.stringify(actuales));
    } catch (e) {
      console.error(e);
    }
    return nuevoPago;
  }
};

/* Recargo por servicio. Tiene que coincidir con PORCENTAJE_SERVICIO del
   backend (App/API/pagos.py); solo se usa para el cálculo del modo mock. */
export const PORCENTAJE_SERVICIO = 0.10;

/**
 * Cobra la mesa completa: un solo pago que cubre todos sus pedidos activos.
 *
 * Antes la caja llamaba a `registrarPago` con `pedidosMesa[0]` aunque cobrara
 * el total de la mesa, así que la boleta solo listaba los platos del primer
 * pedido. El monto lo calcula el backend a partir de los detalles: aquí solo
 * viajan el método de pago y la propina.
 */
export const cobrarMesa = async (idMesa, metodoPago, propina = 0) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/pagos/mesa/${idMesa}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        metodo_pago: metodoPago,
        propina: propina ? parseFloat(propina) : 0
      })
    });
    verificarSesion(res);
    if (!res.ok) {
      const detalle = await res.json().catch(() => ({}));
      throw new Error(detalle.detail || 'No se pudo cobrar la mesa');
    }
    return await res.json();
  } catch (e) {
    // Sin backend: un único pago mock que junta los platos de todos los
    // pedidos activos de la mesa, igual que hace el endpoint real.
    const mockPeds = getMockPedidosLocales();
    const pedidosMesa = (mockPeds[String(idMesa)] || [])
      .filter(p => p.estado !== 'pagado' && p.estado !== 'cancelado');

    const items = pedidosMesa.flatMap(p => p.items || []);
    const subtotal = items.reduce((acc, it) => acc + Number(it.precio) * it.cantidad, 0);

    const nuevoPago = {
      id_pago: Date.now(),
      id_pedido: pedidosMesa.length ? pedidosMesa[0].id_pedido : null,
      id_mesa: parseInt(idMesa),
      monto_total: Number((subtotal * (1 + PORCENTAJE_SERVICIO)).toFixed(2)),
      propina: propina ? parseFloat(propina) : 0,
      metodo_pago: metodoPago,
      fecha_pago: new Date().toISOString(),
      subtotal: Number(subtotal.toFixed(2)),
      items
    };

    try {
      const actuales = JSON.parse(localStorage.getItem('swifttable_mock_pagos') || '[]');
      actuales.push(nuevoPago);
      localStorage.setItem('swifttable_mock_pagos', JSON.stringify(actuales));

      // Los pedidos cobrados dejan de estar activos, como en el backend.
      const todos = getMockPedidosLocales();
      todos[String(idMesa)] = (todos[String(idMesa)] || []).map(p =>
        pedidosMesa.some(pm => pm.id_pedido === p.id_pedido) ? { ...p, estado: 'pagado' } : p
      );
      localStorage.setItem('swifttable_mock_pedidos', JSON.stringify(todos));
    } catch (err) {
      console.error(err);
    }
    return nuevoPago;
  }
};

const seedMockPagos = () => {
  try {
    const val = localStorage.getItem('swifttable_mock_pagos');
    if (!val) {
      const iniciales = [
        {
          id_pago: 201,
          id_pedido: 301,
          id_mesa: 3,
          monto_total: 46.20,
          propina: 5.00,
          metodo_pago: 'yape',
          fecha_pago: new Date(Date.now() - 7200000).toISOString(),
          items: [
            { nombre: 'Pollo a la brasa 1/2', cantidad: 1, precio: '32.00' },
            { nombre: 'Inca Kola 500ml', cantidad: 2, precio: '5.00' }
          ]
        },
        {
          id_pago: 202,
          id_pedido: 101,
          id_mesa: 1,
          monto_total: 29.80,
          propina: 3.00,
          metodo_pago: 'tarjeta',
          fecha_pago: new Date(Date.now() - 3600000).toISOString(),
          items: [
            { nombre: 'Chicharrón de pollo', cantidad: 2, precio: '12.00' },
            { nombre: 'Coca-Cola 500ml', cantidad: 1, precio: '5.00' }
          ]
        },
        {
          id_pago: 203,
          id_pedido: 501,
          id_mesa: 5,
          monto_total: 33.00,
          propina: 0.00,
          metodo_pago: 'efectivo',
          fecha_pago: new Date(Date.now() - 1800000).toISOString(),
          items: [
            { nombre: 'Pollo a la brasa 1/4', cantidad: 1, precio: '18.00' },
            { nombre: 'Chicharrón de pollo', cantidad: 1, precio: '12.00' }
          ]
        }
      ];
      localStorage.setItem('swifttable_mock_pagos', JSON.stringify(iniciales));
      return iniciales;
    }
    return JSON.parse(val);
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const getPagos = async (idRestaurante = null) => {
  try {
    const url = idRestaurante ? `${API_URL}/pagos/?id_restaurante=${idRestaurante}` : `${API_URL}/pagos/`
    const res = await fetchWithTimeout(url, { headers: authHeaders() });
    verificarSesion(res);
    if (!res.ok) throw new Error('Error');
    const pagosList = await res.json();
    
    const pagosEnriquecidos = await Promise.all(pagosList.map(async (pago) => {
      try {
        const pedRes = await fetchWithTimeout(`${API_URL}/pedidos/${pago.id_pedido}`);
        if (pedRes.ok) {
          const ped = await pedRes.json();
          const dRes = await fetchWithTimeout(`${API_URL}/detalles_pedido/pedido/${pago.id_pedido}`);
          let items = [];
          if (dRes.ok) {
            const detalles = await dRes.json();
            const platosList = await fetchWithTimeout(`${API_URL}/productos/`).then(r => r.ok ? r.json() : []);
            items = detalles.map(d => {
              const prod = platosList.find(pr => pr.id_producto === d.id_producto);
              return {
                nombre: prod ? prod.nombre : `Producto #${d.id_producto}`,
                cantidad: d.cantidad,
                precio: d.precio_unitario
              };
            });
          }
          return {
            ...pago,
            id_mesa: ped.id_mesa || 1,
            items
          };
        }
      } catch (err) {
        console.error(err);
      }
      return { ...pago, id_mesa: 1, items: [] };
    }));
    return pagosEnriquecidos;
  } catch {
    return seedMockPagos();
  }
};

export const actualizarEstadoPedido = async (idPedido, nuevoEstado) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/pedidos/${idPedido}/estado?nuevo_estado=${nuevoEstado}`, {
      method: 'PUT',
      headers: authHeaders()
    });
    verificarSesion(res);
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch {
    try {
      const peds = getMockPedidosLocales();
      Object.keys(peds).forEach(mesaId => {
        peds[mesaId] = peds[mesaId].map(p => 
          p.id_pedido === parseInt(idPedido) ? { ...p, estado: nuevoEstado } : p
        );
      });
      localStorage.setItem('swifttable_mock_pedidos', JSON.stringify(peds));
    } catch (e) {
      console.error(e);
    }
    return { id_pedido: parseInt(idPedido), estado: nuevoEstado };
  }
};



