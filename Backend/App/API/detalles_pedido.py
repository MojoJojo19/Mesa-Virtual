from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.detalle_pedido import DetallePedido
from App.Models.producto import Producto
from App.Schemas.detalle_pedido import DetallePedidoCreate, DetallePedidoResponse

router = APIRouter(prefix="/api/detalles_pedido", tags=["Detalles de Pedido"])

@router.post("/", response_model=DetallePedidoResponse)
def crear_detalle(datos: DetallePedidoCreate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id_producto == datos.id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    precio = producto.precio
    subtotal = precio * datos.cantidad

    nuevo = DetallePedido(
        id_pedido=datos.id_pedido,
        id_producto=datos.id_producto,
        cantidad=datos.cantidad,
        precio_unitario=precio,
        subtotal=subtotal
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=List[DetallePedidoResponse])
def listar_detalles(db: Session = Depends(get_db)):
    return db.query(DetallePedido).all()

@router.get("/pedido/{id_pedido}", response_model=List[DetallePedidoResponse])
def detalles_por_pedido(id_pedido: int, db: Session = Depends(get_db)):
    return db.query(DetallePedido).filter(DetallePedido.id_pedido == id_pedido).all()