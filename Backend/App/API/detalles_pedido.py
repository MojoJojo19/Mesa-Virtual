from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.detalle_pedido import DetallePedido
from App.Schemas.detalle_pedido import DetallePedidoCreate, DetallePedidoResponse

router = APIRouter(prefix="/api/detalles_pedido", tags=["Detalles de Pedido"])

@router.post("/", response_model=DetallePedidoResponse)
def crear_detalle(datos: DetallePedidoCreate, db: Session = Depends(get_db)):
    nuevo = DetallePedido(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=list[DetallePedidoResponse])
def listar_detalles(db: Session = Depends(get_db)):
    return db.query(DetallePedido).all()
