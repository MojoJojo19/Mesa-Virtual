from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.comensal import Comensal
from App.Schemas.comensal import ComensalCreate, ComensalResponse

router = APIRouter(prefix="/api/comensales", tags=["Comensales"])

@router.post("/", response_model=ComensalResponse)
def crear_comensal(datos: ComensalCreate, db: Session = Depends(get_db)):
    nuevo = Comensal(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=list[ComensalResponse])
def listar_comensales(db: Session = Depends(get_db)):
    return db.query(Comensal).all()
