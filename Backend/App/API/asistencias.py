from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.asistencia import Asistencia
from App.Schemas.asistencia import AsistenciaCreate, AsistenciaResponse

router = APIRouter(prefix="/api/asistencias", tags=["Asistencias"])

@router.post("/", response_model=AsistenciaResponse)
def crear_asistencia(datos: AsistenciaCreate, db: Session = Depends(get_db)):
    nuevo = Asistencia(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=list[AsistenciaResponse])
def listar_asistencias(db: Session = Depends(get_db)):
    return db.query(Asistencia).all()
