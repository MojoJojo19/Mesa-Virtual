import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { User, ChevronLeft } from 'lucide-react'
import { crearComensal } from '../services/api'
import { useToast } from '../components/Toast'

const AVATARES = ['🐶', '🐱', '🦊', '🐸', '🦁', '🐻', '🐼', '🐨', '🐯', '🐮', '🐷', '🐵']

export default function Ingreso() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [nombre, setNombre] = useState('')
  const [avatar, setAvatar] = useState('🐱')
  const [cargando, setCargando] = useState(false)

  const handleUnirse = async () => {
    if (!nombre.trim()) {
      toast('Ingresa tu nombre para continuar', 'error')
      return
    }

    setCargando(true)
    const nuevoComensal = await crearComensal(nombre.trim(), avatar, idMesa)
    setCargando(false)

    if (nuevoComensal) {
      localStorage.setItem('swifttable_user', JSON.stringify({
        id: nuevoComensal.id_comensal,
        nombre: nuevoComensal.nombre,
        avatar: nuevoComensal.avatar,
        idMesa,
        isLider: true, 
        modoPago: 'individual' 
      }))
      navigate(`/mesa/${idMesa}/lobby`)
    } else {
      toast('Error al ingresar', 'error')
    }
  }

  return (
    <>
      <div className="native-app-bar">
        <div className="left-action">
          <button className="wf-btn-ghost" onClick={() => navigate(-1)} style={{ padding: 0 }}>
            <ChevronLeft size={28} color="var(--accent)" />
          </button>
        </div>
        <div className="title">Identificación</div>
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
