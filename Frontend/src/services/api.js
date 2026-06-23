const SIMULACION_HABILITADA = false;

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Adaptador automático para emulador Android (10.0.2.2) o pruebas en red local (192.168.x.x)
  if (window.location.hostname === '10.0.2.2' || window.location.hostname.startsWith('192.168.')) {
    return `http://${window.location.hostname}:8000/api`;
  }
  return 'http://127.0.0.1:8000/api';
};
export const API_URL = getApiUrl();

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
  capacidad: 4, pin: '7823', estado: 'activa', token_sesion: 'mock_token'
}

// ─── Helper para evitar esperas largas si el backend no responde y enviar Token JWT ───
const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 10000, ...rest } = options;
  
  // BUENA PRÁCTICA API: Adjuntar Token JWT automáticamente a todas las peticiones
  const token = localStorage.getItem('swifttable_token');
  if (token) {
    rest.headers = {
      ...rest.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  // Desactivar caché del navegador para todas las llamadas API
  rest.cache = 'no-store';

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { ...rest, signal: controller.signal });
  clearTimeout(id);
  return response;
};


// ─── API calls ───────────────────────────────────────────────────
export const getPlatos = async (idRestaurante = null) => {
  try {
    const url = idRestaurante ? `${API_URL}/productos/?id_restaurante=${idRestaurante}` : `${API_URL}/productos/`
    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
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
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
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
    const res = await fetchWithTimeout(`${API_URL}/mesas/${idMesa}`)
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    return { ...MOCK_MESA, id_mesa: idMesa }
  }
}

export const actualizarTiempoEsperaMesa = async (idMesa, minutos) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/mesas/${idMesa}/tiempo-espera`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutos: parseInt(minutos) })
    })
    if (!res.ok) throw new Error('Error al actualizar tiempo de espera de mesa')
    return await res.json()
  } catch (e) {
    throw e
  }
}

export const actualizarConfigMesa = async (idMesa, tipoPago) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/mesas/${idMesa}/configuracion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo_pago: tipoPago })
    })
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    return { success: true, tipo_pago: tipoPago }
  }
}

export const actualizarTiempoEspera = async (idRestaurante, minutos) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/restaurantes/${idRestaurante}/tiempo-espera`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutos })
    })
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch {
    return { success: true, tiempo_espera_global: minutos }
  }
}

export const getRestaurante = async (idRestaurante) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/restaurantes/${idRestaurante}`)
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    return { id_restaurante: idRestaurante, tiempo_espera_global: 15 }
  }
}

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
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    const mockMesas = getMockMesasLocales()
    const mesa = mockMesas.find(m => m.id_mesa === parseInt(idMesa))
    return mesa ? mesa.pin === pin : false
  }
}

export const validarToken = async (idMesa, token) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/mesas/${idMesa}/validar-token?token=${token}`)
    if (!res.ok) throw new Error('Error')
    const data = await res.json()
    return data.valido
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    const mockMesas = getMockMesasLocales()
    const mesa = mockMesas.find(m => m.id_mesa === parseInt(idMesa))
    return mesa ? mesa.token_sesion === token : false;
  }
}

export const buscarMesaPorPin = async (pin) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/mesas/buscar-por-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    })
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    // Fallback mock: buscar en los datos locales simulados
    const mockMesas = getMockMesasLocales()
    const mesa = mockMesas.find(m => m.pin === pin)
    if (mesa) {
      return {
        encontrado: true,
        id_mesa: mesa.id_mesa,
        numero_mesa: mesa.numero,
        nombre_restaurante: 'La Fogata'
      }
    }
    return { encontrado: false }
  }
}

export const loginPersonal = async (correo, contrasena) => {
  try {
    const formData = new URLSearchParams()
    formData.append('username', correo)
    formData.append('password', contrasena)

    const res = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })
    
    if (!res.ok) throw new Error('Credenciales incorrectas')
    return await res.json()
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    // Mock login para desarrollo sin backend
    if (correo === 'admin@fogata.com' || correo === 'mesero@fogata.com') {
      return {
        access_token: 'mock_token',
        rol: correo.includes('admin') ? 'admin' : 'mesero',
        id_usuario: 99,
        id_restaurante: 1,
        nombre_restaurante: 'La Fogata'
      }
    }
    throw err
  }
}

export const crearComensal = async (nombre, avatar, idMesa) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/comensales/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, avatar, id_mesa: parseInt(idMesa) })
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Error al ingresar');
    }
    return await res.json()
  } catch (e) {
    if (e.message && e.message !== 'Error' && e.message !== 'Error al ingresar') {
      throw e; // Lanzar error específico del backend para que Ingreso.jsx lo muestre
    }
    if (!SIMULACION_HABILITADA) throw e;
    // Fallback: simular creación exitosa si el error es de conexión genérica
    return { id_comensal: Date.now(), nombre, avatar, id_mesa: parseInt(idMesa) }
  }
}

export const hacerLiderMesa = async (idComensal) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/comensales/${idComensal}/hacer-lider`, {
      method: 'PUT'
    })
    if (!res.ok) throw new Error('Error al asignar líder')
    return await res.json()
  } catch (err) {
    throw err
  }
}

export const getComensalesDeMesa = async (idMesa) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/mesas/${idMesa}/comensales`)
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    return []
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
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    return { id_pedido: Date.now(), items, estado: 'pendiente' }
  }
}

export const actualizarCarritoComensal = async (idComensal, estadoPedido, carrito) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/comensales/${idComensal}/carrito`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado_pedido: estadoPedido, carrito })
    })
    if (!res.ok) throw new Error('Error')
    return await res.json()
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    return { success: true } // Fallback simulado
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
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
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
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
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
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    return getMockAsistenciasLocales();
  }
};

export const atenderAsistencia = async (idAsistencia) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/asistencias/${idAsistencia}/atender`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
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
        { id_mesa: 1, numero: 1, estado: 'libre', pin: '1234', token_sesion: 'token1', comensales: [] },
        { id_mesa: 2, numero: 2, estado: 'libre', pin: '5678', token_sesion: 'token2', comensales: [] },
        { id_mesa: 3, numero: 3, estado: 'ocupada', pin: '4321', token_sesion: 'token3', comensales: [{ nombre: 'Juan', avatar: '🐱' }, { nombre: 'María', avatar: '🦊' }] },
        { id_mesa: 4, numero: 4, estado: 'libre', pin: '8765', token_sesion: 'token4', comensales: [] },
        { id_mesa: 5, numero: 5, estado: 'ocupada', pin: '2468', token_sesion: 'token5', comensales: [{ nombre: 'Pedro', avatar: '🐶' }] },
        { id_mesa: 6, numero: 6, estado: 'libre', pin: '1357', token_sesion: 'token6', comensales: [] },
        { id_mesa: 7, numero: 7, estado: 'ocupada', pin: '7823', token_sesion: 'token7', comensales: [{ nombre: 'Carlos', avatar: '🐱', isLider: true }, { nombre: 'Ana', avatar: '🐶' }] },
        { id_mesa: 1001, numero: 1001, estado: 'libre', pin: '1111', token_sesion: 'token1001', comensales: [] }
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
    const url = idRestaurante ? `${API_URL}/mesas/?id_restaurante=${idRestaurante}` : `${API_URL}/mesas/`
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('Error');
    const data = await res.json();
    // Ordenar mesas por número ascendente
    return data.sort((a, b) => a.numero - b.numero);
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err
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
      method: 'POST'
    });
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    try {
      // 1. Liberar Mesa (estado libre, nuevo PIN, limpiar comensales)
      const actuales = getMockMesasLocales();
      const nuevas = actuales.map(m => {
        if (m.id_mesa === parseInt(idMesa)) {
          return { 
            ...m, 
            estado: 'libre', 
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
    
    // Fetch platos ONCE to avoid N+1 requests
    const platosList = await fetchWithTimeout(`${API_URL}/productos/`).then(r => r.ok ? r.json() : []).catch(() => []);

    const pedidosConDetalles = await Promise.all(pedidos.map(async (ped) => {
      try {
        const dRes = await fetchWithTimeout(`${API_URL}/detalles_pedido/pedido/${ped.id_pedido}`);
        if (dRes.ok) {
          const detalles = await dRes.json();
          const items = detalles.map(d => {
            const prod = platosList.find(p => p.id_producto === d.id_producto);
            return {
              nombre: prod ? prod.nombre : `Producto #${d.id_producto}`,
              cantidad: d.cantidad,
              precio: d.precio_unitario,
              id_producto: d.id_producto
            };
          });
          return { ...ped, items };
        }
        return { ...ped, items: [] };
      } catch {
        return { ...ped, items: [] };
      }
    }));

    // Retornar solo pedidos ACTIVOS (no pagados ni cancelados) para logística
    return pedidosConDetalles.filter(p => p.estado !== 'pagado' && p.estado !== 'cancelado');
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err
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
    
    // Fetch platos ONCE to avoid N+1 requests
    const platosList = await fetchWithTimeout(`${API_URL}/productos/`).then(r => r.ok ? r.json() : []).catch(() => []);

    const pedidosConDetalles = await Promise.all(pedidos.map(async (ped) => {
      try {
        const dRes = await fetchWithTimeout(`${API_URL}/detalles_pedido/pedido/${ped.id_pedido}`);
        if (dRes.ok) {
          const detalles = await dRes.json();
          const items = detalles.map(d => {
            const prod = platosList.find(p => p.id_producto === d.id_producto);
            return {
              nombre: prod ? prod.nombre : `Producto #${d.id_producto}`,
              cantidad: d.cantidad,
              precio: d.precio_unitario,
              id_producto: d.id_producto
            };
          });
          return { ...ped, items };
        }
        return { ...ped, items: [] };
      } catch (e) {
        console.error(e);
        return { ...ped, items: [] };
      }
    }));
    return pedidosConDetalles;
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
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
  // Obtener id_usuario logueado (mesero) si existe
  const tokenStr = localStorage.getItem('swifttable_staff_token')
  const userStr = localStorage.getItem('swifttable_staff_user')
  let idUsuario = null
  if (userStr) {
    try { idUsuario = JSON.parse(userStr).id_usuario } catch (e) {}
  }

  const payload = {
    monto_total: parseFloat(montoTotal),
    propina: propina ? parseFloat(propina) : 0,
    metodo_pago: metodoPago,
    id_pedido: parseInt(idPedido),
    id_usuario: idUsuario
  };
  try {
    const res = await fetchWithTimeout(`${API_URL}/pagos/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(tokenStr ? { 'Authorization': `Bearer ${tokenStr}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err
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
    const res = await fetchWithTimeout(url);
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
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
    return seedMockPagos();
  }
};

export const actualizarEstadoPedido = async (idPedido, nuevoEstado) => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/pedidos/${idPedido}/estado?nuevo_estado=${nuevoEstado}`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch (err) {
    if (!SIMULACION_HABILITADA) throw err;
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



