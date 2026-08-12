// ─────────────────────────────────────────────────────────────────────────────
// utils/metricas.js
// Funciones puras para calcular agregados a partir de los datos crudos que ya
// carga el panel de administración (pagos, pedidos, mesas).
// Sin dependencias externas. Sin tocar el backend.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve los límites [inicio, fin] de un período dado.
 * @param {'hoy'|'ayer'|'semana'|'mes'} periodo
 * @returns {{ inicio: Date, fin: Date }}
 */
export function obtenerRangoPeriodo(periodo) {
  const ahora = new Date()
  const fin = new Date(ahora)
  let inicio = new Date(ahora)

  switch (periodo) {
    case 'hoy':
      inicio.setHours(0, 0, 0, 0)
      break
    case 'ayer': {
      const ayer = new Date(ahora)
      ayer.setDate(ayer.getDate() - 1)
      inicio = new Date(ayer)
      inicio.setHours(0, 0, 0, 0)
      fin.setHours(0, 0, 0, 0) // hasta las 00:00 de hoy
      break
    }
    case 'semana': {
      // lunes de esta semana 00:00 → ahora
      const dia = (ahora.getDay() + 6) % 7 // 0 = lunes
      inicio = new Date(ahora)
      inicio.setDate(ahora.getDate() - dia)
      inicio.setHours(0, 0, 0, 0)
      break
    }
    case 'mes': {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0)
      break
    }
    default:
      inicio.setHours(0, 0, 0, 0)
  }
  return { inicio, fin }
}

/**
 * Devuelve el rango equivalente para comparar contra "ayer" del período actual.
 * Si el período es "hoy" → devuelve el rango de "ayer".
 * Si es "semana" → devuelve la semana anterior.
 * Si es "mes" → devuelve el mes anterior.
 */
export function obtenerRangoAnterior(periodo) {
  const ahora = new Date()
  if (periodo === 'hoy') {
    return obtenerRangoPeriodo('ayer')
  }
  if (periodo === 'ayer') {
    const hace2dias = new Date(ahora)
    hace2dias.setDate(ahora.getDate() - 2)
    const inicio = new Date(hace2dias)
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(hace2dias)
    fin.setHours(23, 59, 59, 999)
    return { inicio, fin }
  }
  if (periodo === 'semana') {
    const actual = obtenerRangoPeriodo('semana').inicio
    const inicio = new Date(actual)
    inicio.setDate(actual.getDate() - 7)
    const fin = new Date(actual)
    fin.setMilliseconds(-1) // un instante antes de que empiece la semana actual
    return { inicio, fin }
  }
  if (periodo === 'mes') {
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1, 0, 0, 0, 0)
    const fin = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999)
    return { inicio, fin }
  }
  return obtenerRangoPeriodo(periodo)
}

/**
 * Filtra un array de pagos cuyo campo fecha_pago cae dentro del rango.
 */
export function filtrarPagosPorPeriodo(pagos, periodo) {
  const { inicio, fin } = obtenerRangoPeriodo(periodo)
  return (pagos || []).filter((p) => {
    const fecha = new Date(p.fecha_pago)
    return fecha >= inicio && fecha <= fin
  })
}

/**
 * Filtra pagos usando un rango arbitrario (para el "rango anterior").
 */
export function filtrarPagosPorRango(pagos, inicio, fin) {
  return (pagos || []).filter((p) => {
    const fecha = new Date(p.fecha_pago)
    return fecha >= inicio && fecha <= fin
  })
}

/**
 * Calcula delta porcentual. Si el anterior es 0, devuelve null (no se puede calcular).
 */
export function calcularDelta(actual, anterior) {
  if (!anterior || anterior === 0) return null
  return ((actual - anterior) / anterior) * 100
}

/**
 * Calcula los KPIs principales: ventas totales, pedidos, ticket promedio,
 * propinas y deltas vs. el período anterior.
 */
export function calcularKpis(pagos, periodo) {
  const actual = filtrarPagosPorPeriodo(pagos, periodo)
  const { inicio, fin } = obtenerRangoAnterior(periodo)
  const anterior = filtrarPagosPorRango(pagos, inicio, fin)

  const sumaActual = (arr) => arr.reduce((acc, p) => acc + Number(p.monto_total || 0), 0)
  const sumaPropinasActual = (arr) => arr.reduce((acc, p) => acc + Number(p.propina || 0), 0)

  const ventas = sumaActual(actual)
  const ventasAnterior = sumaActual(anterior)

  const pedidos = actual.length
  const pedidosAnterior = anterior.length

  const ticketPromedio = pedidos > 0 ? ventas / pedidos : 0
  const ticketPromedioAnterior = pedidosAnterior > 0 ? ventasAnterior / pedidosAnterior : 0

  const propinas = sumaPropinasActual(actual)
  const propinasAnterior = sumaPropinasActual(anterior)

  return {
    ventas,
    pedidos,
    ticketPromedio,
    propinas,
    delta: {
      ventas: calcularDelta(ventas, ventasAnterior),
      pedidos: calcularDelta(pedidos, pedidosAnterior),
      ticketPromedio: calcularDelta(ticketPromedio, ticketPromedioAnterior),
      propinas: calcularDelta(propinas, propinasAnterior),
    },
  }
}

/**
 * Agrupa los pagos por hora del día (0-23), devolviendo un array de 24 entradas.
 * Si no hay datos en una hora, devuelve 0.
 */
export function agruparVentasPorHora(pagos) {
  const horas = Array.from({ length: 24 }, (_, h) => ({
    hora: h,
    label: `${h.toString().padStart(2, '0')}:00`,
    ventas: 0,
    pedidos: 0,
  }))
  ;(pagos || []).forEach((p) => {
    const fecha = new Date(p.fecha_pago)
    const h = fecha.getHours()
    horas[h].ventas += Number(p.monto_total || 0)
    horas[h].pedidos += 1
  })
  return horas
}

/**
 * Agrupa pagos por método de pago y devuelve totales y conteo.
 */
export function agruparMetodosPago(pagos) {
  const map = {}
  ;(pagos || []).forEach((p) => {
    const metodo = p.metodo_pago || 'otro'
    if (!map[metodo]) {
      map[metodo] = { metodo, monto: 0, count: 0 }
    }
    map[metodo].monto += Number(p.monto_total || 0)
    map[metodo].count += 1
  })
  return Object.values(map)
}

/**
 * Cuenta los items vendidos en pedidos pagados y devuelve los N más populares.
 * items = [{ id_producto, nombre, cantidad, precio }]
 */
export function calcularTopPlatos(pedidos, top = 5) {
  const map = {}
  ;(pedidos || []).forEach((ped) => {
    if (ped.estado !== 'pagado' && ped.estado !== 'servido') return
    ;(ped.items || []).forEach((it) => {
      const nombre = it.nombre || `Producto #${it.id_producto || ''}`
      const cant = Number(it.cantidad || 0)
      if (!map[nombre]) {
        map[nombre] = { nombre, cantidad: 0, ingresos: 0 }
      }
      map[nombre].cantidad += cant
      map[nombre].ingresos += cant * Number(it.precio || 0)
    })
  })
  return Object.values(map)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, top)
}

/**
 * Porcentaje de mesas actualmente ocupadas.
 */
export function calcularOcupacionActual(mesas) {
  const total = (mesas || []).length
  if (total === 0) return { porcentaje: 0, ocupadas: 0, total: 0 }
  const ocupadas = (mesas || []).filter((m) => m.estado === 'ocupada').length
  return {
    porcentaje: Math.round((ocupadas / total) * 100),
    ocupadas,
    total,
  }
}

/**
 * Etiqueta humana para mostrar el período activo.
 */
export function etiquetaPeriodo(periodo) {
  switch (periodo) {
    case 'hoy':
      return 'Hoy'
    case 'ayer':
      return 'Ayer'
    case 'semana':
      return 'Esta semana'
    case 'mes':
      return 'Este mes'
    default:
      return periodo
  }
}
