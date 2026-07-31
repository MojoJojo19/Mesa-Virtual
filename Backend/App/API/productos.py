from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.producto import Producto
from App.Schemas.producto import ProductoCreate, ProductoUpdate, ProductoResponse

from App.Models.usuario import Usuario
from App.Core.security import obtener_usuario_actual

router = APIRouter(prefix="/api/productos", tags=["Productos"])

@router.post("/", response_model=ProductoResponse)
def crear_producto(
    datos: ProductoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    # El restaurante sale del token, no de un parámetro.
    nuevo = Producto(**datos.model_dump(), id_restaurante=usuario_actual.id_restaurante)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=List[ProductoResponse])
def listar_productos(
    id_restaurante: int = None,
    incluir_inactivos: bool = False,
    db: Session = Depends(get_db),
):
    # La carta del comensal solo muestra lo disponible, pero el panel de
    # administración necesita ver también lo desactivado para reactivarlo.
    query = db.query(Producto)
    if not incluir_inactivos:
        query = query.filter(Producto.estado == "disponible")
    if id_restaurante is not None:
        query = query.filter(Producto.id_restaurante == id_restaurante)
    return query.all()

@router.get("/{id}", response_model=ProductoResponse)
def obtener_producto(id: int, db: Session = Depends(get_db)):
    item = db.query(Producto).filter(Producto.id_producto == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    return item

@router.put("/{id}", response_model=ProductoResponse)
def actualizar_producto(
    id: int,
    datos: ProductoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    prod = db.query(Producto).filter(Producto.id_producto == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="No encontrado")
    # exclude_unset: lo que el panel no manda se queda como está, en vez de
    # sobrescribirse con null.
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(prod, campo, valor)
    db.commit()
    db.refresh(prod)
    return prod

@router.delete("/{id}")
def desactivar_producto(
    id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    prod = db.query(Producto).filter(Producto.id_producto == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="No encontrado")
    prod.estado = "inactivo"
    db.commit()
    return {"mensaje": f"Producto '{prod.nombre}' desactivado correctamente"}