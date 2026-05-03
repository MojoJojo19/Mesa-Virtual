const API_URL = 'http://127.0.0.1:8000/api'

export const getPlatos = async () => {
  try {
    const res = await fetch(`${API_URL}/productos/`)
    if (!res.ok) throw new Error('Error al obtener platos')
    return await res.json()
  } catch (error) {
    console.error(error)
    return []
  }
}

export const crearComensal = async (nombre, avatar, idMesa) => {
  try {
    const res = await fetch(`${API_URL}/comensales/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombre,
        avatar: avatar,
        id_mesa: parseInt(idMesa)
      })
    })
    if (!res.ok) throw new Error('Error al crear comensal')
    return await res.json()
  } catch (error) {
    console.error(error)
    return null
  }
}
