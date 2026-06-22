from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.pago import Pago
from App.Schemas.pago import PagoCreate, PagoResponse

router = APIRouter(prefix="/api/pagos", tags=["Pagos"])

@router.post("/", response_model=PagoResponse)
def crear_pago(datos: PagoCreate, db: Session = Depends(get_db)):
    from App.Models.pedido import Pedido, EstadoPedido
    pedido = db.query(Pedido).filter(Pedido.id_pedido == datos.id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    nuevo = Pago(**datos.model_dump(), id_restaurante=pedido.id_restaurante)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=List[PagoResponse])
def listar_pagos(id_restaurante: int = None, db: Session = Depends(get_db)):
    query = db.query(Pago)
    if id_restaurante is not None:
        query = query.filter(Pago.id_restaurante == id_restaurante)
    return query.all()
