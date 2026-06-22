from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.usuario import Usuario
from App.Schemas.usuario import UsuarioCreate, UsuarioResponse
from App.Core.security import obtener_hash_contrasena, obtener_usuario_actual

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])

@router.post("/", response_model=UsuarioResponse)
def crear_usuario(datos: UsuarioCreate, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == datos.correo).first()
    if usuario:
        raise HTTPException(status_code=400, detail="Correo ya registrado")
    # Encriptar contraseña antes de guardarla
    datos_dict = datos.model_dump()
    datos_dict["contrasena"] = obtener_hash_contrasena(datos_dict["contrasena"])
    
    nuevo = Usuario(**datos_dict)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

from typing import List

@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db), usuario_actual: Usuario = Depends(obtener_usuario_actual)):
    return db.query(Usuario).all()

@router.get("/{id}", response_model=UsuarioResponse)
def obtener_usuario(id: int, db: Session = Depends(get_db)):
    item = db.query(Usuario).filter(Usuario.id_usuario == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    return item

@router.delete("/{id}")
def eliminar_usuario(id: int, db: Session = Depends(get_db)):
    item = db.query(Usuario).filter(Usuario.id_usuario == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    # Soft-delete: si un usuario hizo pedidos como mesero, borrarlo de verdad
    # rompería ese historial (FK Pedido.id_usuario). Solo lo desactivamos.
    item.estado = "inactivo"
    db.commit()
    db.refresh(item)
    return {"mensaje": "Usuario desactivado correctamente"}
