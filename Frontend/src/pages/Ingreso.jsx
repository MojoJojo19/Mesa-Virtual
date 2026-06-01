import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { crearComensal } from '../services/api'

const AVATARES = ['🐶', '🐱', '🦊', '🐸', '🐼', '🦁', '🐨', '🐯']

export default function Ingreso() {
  const { idMesa } = useParams()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [avatar, setAvatar] = useState('🐱')
  const [cargando, setCargando] = useState(false)

  const handleUnirse = async () => {
    if (!nombre.trim()) {
      alert('Por favor escribe tu nombre')
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
    }
  }

  return (
    <>
      <div className="top-bar">
        <span>SwiftTable</span>
        <div className="mesa-badge">Mesa {idMesa}</div>
      </div>

      <div className="flex-col flex-1 animate-fade-in">
        <h1 className="title-main">¿Cómo te llamas?</h1>
        <p className="subtitle">Tus compañeros de mesa te verán así</p>

        {/* Input nombre */}
        <div className="wf-block animate-fade-in stagger-1">
          <label className="wf-label" htmlFor="input-nombre">Tu nombre</label>
          <input
            id="input-nombre"
            type="text"
            className="wf-input"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnirse()}
            placeholder="Ej. Carlos"
            maxLength={20}
            autoComplete="off"
            autoFocus
          />
        </div>

        {/* Selección de avatar */}
        <div className="wf-block animate-fade-in stagger-2" style={{ marginBottom: '20px' }}>
          <span className="wf-label">Elige tu avatar</span>
          <div className="avatar-grid">
            {AVATARES.map(a => (
              <div
                key={a}
                id={`avatar-${a}`}
                className={`avatar-item ${avatar === a ? 'selected' : ''}`}
                onClick={() => setAvatar(a)}
                title={a}
              >
                {a}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Avatar seleccionado: {avatar}
          </p>
        </div>

        <button
          id="btn-unirse"
          className="wf-btn-solid"
          onClick={handleUnirse}
          disabled={cargando}
          style={{ marginTop: 'auto', opacity: cargando ? 0.7 : 1 }}
        >
          {cargando ? 'Conectando...' : 'Unirme a la mesa →'}
        </button>
      </div>
    </>
  )
}
