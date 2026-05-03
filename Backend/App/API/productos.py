from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.producto import Producto
from App.Schemas.producto import ProductoCreate, ProductoResponse

router = APIRouter(prefix="/api/productos", tags=["Productos"])

@router.post("/", response_model=ProductoResponse)
def crear_producto(datos: ProductoCreate, db: Session = Depends(get_db)):
    nuevo = Producto(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=list[ProductoResponse])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(Producto).all()

@router.get("/{id}", response_model=ProductoResponse)
def obtener_producto(id: int, db: Session = Depends(get_db)):
    item = db.query(Producto).filter(Producto.id_producto == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    return item
