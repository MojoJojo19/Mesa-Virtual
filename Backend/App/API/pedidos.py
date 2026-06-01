from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.pedido import Pedido
from App.Schemas.pedido import PedidoCreate, PedidoResponse

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])

@router.post("/", response_model=PedidoResponse)
def crear_pedido(datos: PedidoCreate, db: Session = Depends(get_db)):
    nuevo = Pedido(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=list[PedidoResponse])
def listar_pedidos(db: Session = Depends(get_db)):
    return db.query(Pedido).all()
