from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.producto import Producto
from App.Schemas.producto import ProductoCreate, ProductoResponse

router = APIRouter(prefix="/api/productos", tags=["Productos"])

@router.post("/", response_model=ProductoResponse)
def crear_producto(datos: ProductoCreate, id_restaurante: int, db: Session = Depends(get_db)):
    nuevo = Producto(**datos.model_dump(), id_restaurante=id_restaurante)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=List[ProductoResponse])
def listar_productos(id_restaurante: int = None, db: Session = Depends(get_db)):
    query = db.query(Producto).filter(Producto.estado == "disponible")
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
def actualizar_producto(id: int, datos: ProductoCreate, db: Session = Depends(get_db)):
    prod = db.query(Producto).filter(Producto.id_producto == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="No encontrado")
    for campo, valor in datos.model_dump().items():
        setattr(prod, campo, valor)
    db.commit()
    db.refresh(prod)
    return prod

@router.delete("/{id}")
def desactivar_producto(id: int, db: Session = Depends(get_db)):
    prod = db.query(Producto).filter(Producto.id_producto == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="No encontrado")
    prod.estado = "inactivo"
    db.commit()
    return {"mensaje": f"Producto '{prod.nombre}' desactivado correctamente"}