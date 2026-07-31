/**
 * Identidad visual de "modo sala".
 *
 * Cada comensal se representa con una ficha de color y la inicial de su
 * nombre, en lugar de un emoji. El color se guarda como hex en el campo
 * `avatar` del comensal, así que el backend no cambia.
 */

/* Paleta de fichas: fondo + color de texto que contrasta sobre ese fondo. */
export const COLORES_COMENSAL = [
  { hex: '#FFC02E', fg: '#150a24' },
  { hex: '#23D5E0', fg: '#150a24' },
  { hex: '#FF4E5B', fg: '#ffffff' },
  { hex: '#B8F14E', fg: '#150a24' },
  { hex: '#7A3DF5', fg: '#ffffff' },
  { hex: '#F58DBE', fg: '#150a24' },
  { hex: '#5CE0A0', fg: '#150a24' },
  { hex: '#F5F1FA', fg: '#150a24' }
]

const POR_HEX = COLORES_COMENSAL.reduce((mapa, c) => {
  mapa[c.hex.toUpperCase()] = c
  return mapa
}, {})

/** Suma estable de los caracteres, para elegir siempre el mismo color por nombre. */
function hash(texto) {
  let n = 0
  for (let i = 0; i < texto.length; i++) n = (n * 31 + texto.charCodeAt(i)) >>> 0
  return n
}

/**
 * Resuelve la ficha de color de un comensal.
 *
 * Acepta el valor crudo de `avatar`: si es un hex de la paleta lo usa tal
 * cual, y si no (comensales antiguos guardados con emoji, o sin avatar)
 * deriva un color estable a partir del nombre.
 */
export function colorComensal(avatar, nombre = '') {
  if (typeof avatar === 'string') {
    const directo = POR_HEX[avatar.trim().toUpperCase()]
    if (directo) return directo
  }
  return COLORES_COMENSAL[hash(nombre || 'comensal') % COLORES_COMENSAL.length]
}

/** Primera letra del nombre, para el monograma de la ficha. */
export function inicial(nombre) {
  const limpio = (nombre || '').trim()
  return limpio ? limpio.charAt(0).toUpperCase() : '?'
}

/* ---------------------------------------------------------------- */

/**
 * Acento por restaurante. Viste el mismo sistema con el color del local:
 * es lo único que cambia entre un restaurante y otro.
 */
const ACENTOS = ['#FF4E5B', '#7A3DF5', '#23D5E0', '#FFC02E']
const ACENTO_POR_DEFECTO = ACENTOS[0]

/** Aplica el acento del restaurante a toda la app. */
export function aplicarAcento(idRestaurante) {
  const id = parseInt(idRestaurante, 10)
  const acento = Number.isNaN(id) ? ACENTO_POR_DEFECTO : ACENTOS[(id - 1 + ACENTOS.length) % ACENTOS.length]
  document.documentElement.style.setProperty('--st-accent', acento)
  return acento
}

/** Lee el nombre del restaurante guardado al escanear el QR. */
export function nombreRestaurante() {
  return localStorage.getItem('swifttable_nombre_restaurante') || 'SwiftTable'
}
