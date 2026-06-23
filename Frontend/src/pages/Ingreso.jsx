import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { User, ChevronLeft } from 'lucide-react'
import { crearComensal, getMesa } from '../services/api'
import { useToast } from '../components/Toast'

const AVATARES = ['🐶', '🐱', '🦊', '🐸', '🦁', '🐻', '🐼', '🐨', '🐯', '🐮', '🐷', '🐵']

export default function Ingreso() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [nombre, setNombre] = useState('')
  const [avatar, setAvatar] = useState('🐱')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const cargarDetallesMesa = async () => {
      try {
        const mesa = await getMesa(idMesa)
        if (mesa) {
          const restName = mesa.restaurante ? mesa.restaurante.nombre : (mesa.nombre_restaurante ? mesa.nombre_restaurante : 'La Fogata')
          localStorage.setItem('swifttable_nombre_restaurante', restName)
          localStorage.setItem('swifttable_numero_mesa', mesa.numero)
        }
      } catch (err) {
        console.error("Error al cargar la mesa tras ingreso:", err)
      }
    }
    cargarDetallesMesa()
  }, [idMesa])

  const handleUnirse = async () => {
    if (!nombre.trim()) {
      toast('Ingresa tu nombre para continuar', 'error')
      return
    }

    setCargando(true)
    try {
      const nuevoComensal = await crearComensal(nombre.trim(), avatar, idMesa)
      setCargando(false)
      
      if (nuevoComensal) {
        localStorage.setItem('swifttable_user', JSON.stringify({
          id: nuevoComensal.id_comensal,
          nombre: nuevoComensal.nombre,
          avatar: nuevoComensal.avatar,
          idMesa,
          isLider: false, 
          modoPago: 'individual' 
        }))
        navigate(`/mesa/${idMesa}/lobby`)
      }
    } catch (e) {
      setCargando(false)
      toast(e.message || 'Error al ingresar', 'error')
    }
  }

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

      <div className="content-wrapper flex-col">
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
            <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', boxShadow: 'var(--shadow-sm)' }}>
              {avatar}
            </div>
          </div>
          <h1 className="title-large" style={{ fontSize: '28px' }}>¿Quién eres?</h1>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <input
            className="wf-input"
            placeholder="Escribe tu nombre..."
            value={nombre}
            onChange={e => setNombre(e.target.value.substring(0, 15))}
            autoFocus
          />
        </div>

        <div className="section-label" style={{ marginTop: '24px', marginLeft: '4px' }}>Selecciona tu avatar</div>
        <div className="avatar-grid">
          {AVATARES.map(a => (
            <div 
              key={a}
              className={`avatar-item ${avatar === a ? 'selected' : ''}`}
              onClick={() => setAvatar(a)}
            >
              {a}
            </div>
          ))}
        </div>
      </div>

      <div className="native-bottom-bar">
        <button 
          className="wf-btn-solid" 
          onClick={handleUnirse}
          disabled={!nombre.trim() || cargando}
        >
          {cargando ? 'Conectando...' : 'Entrar a la mesa'}
        </button>
      </div>
    </>
  )
}
