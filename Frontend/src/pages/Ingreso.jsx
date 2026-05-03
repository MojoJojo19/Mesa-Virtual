import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { crearComensal } from '../services/api'

const AVATARES = ['🐶', '🐱', '🦊', '🐸', '🐼', '🦁', '🐨', '🐯']

export default function Ingreso() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [avatar, setAvatar] = useState('🐱')

  const handleUnirse = async () => {
    if (!nombre) return alert('Pon tu nombre')
    
    // Llamada real al backend
    const nuevoComensal = await crearComensal(nombre, avatar, idMesa)
    
    if (nuevoComensal) {
      // Guardar en localStorage para recordarlo en otras pantallas
      localStorage.setItem('swifttable_user', JSON.stringify({ 
        id: nuevoComensal.id_comensal,
        nombre: nuevoComensal.nombre, 
        avatar: nuevoComensal.avatar, 
        idMesa, 
        isLider: true // Simplificación: el primero en entrar es líder
      }))
      navigate(`/mesa/${idMesa}/lobby`)
    } else {
      alert('Error al conectar con la base de datos')
    }
  }

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 className="title-main">¿Cómo te llamas?</h1>
        <p className="subtitle">Tus compañeros de mesa te verán así</p>

        <div className="wf-block">
          <label className="wf-label">Tu nombre</label>
          <input 
            type="text" 
            className="wf-input" 
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Carlos_"
          />
        </div>

        <div style={{ margin: '20px 0' }}>
          <span className="wf-label" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Elige tu avatar</span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', margin: '15px 0' }}>
            {AVATARES.map(a => (
              <div 
                key={a}
                onClick={() => setAvatar(a)}
                style={{
                  width: '45px', height: '45px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px',
                  cursor: 'pointer',
                  border: avatar === a ? '2px solid var(--color-text-primary)' : '2px dashed var(--color-border-secondary)',
                  backgroundColor: 'var(--color-background-primary)'
                }}
              >
                {a}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Avatar seleccionado: {avatar}
          </p>
        </div>

        <button className="wf-btn-solid" onClick={handleUnirse}>
          Unirme a la mesa →
        </button>
      </div>
    </>
  )
}
