from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.pago import Pago
from App.Schemas.pago import PagoCreate, PagoResponse

router = APIRouter(prefix="/api/pagos", tags=["Pagos"])

@router.post("/", response_model=PagoResponse)
def crear_pago(datos: PagoCreate, db: Session = Depends(get_db)):
    nuevo = Pago(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=list[PagoResponse])
def listar_pagos(db: Session = Depends(get_db)):
    return db.query(Pago).all()
