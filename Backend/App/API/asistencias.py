from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.asistencia import Asistencia, EstadoAsistencia
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


@router.get("/mesa/{id_mesa}", response_model=list[AsistenciaResponse])
def listar_asistencias_de_mesa(id_mesa: int, db: Session = Depends(get_db)):
    """Útil para el dashboard del mesero: ver llamados pendientes por mesa."""
    return db.query(Asistencia).filter(Asistencia.id_mesa == id_mesa).all()


@router.put("/{id_asistencia}/atender", response_model=AsistenciaResponse)
def marcar_atendido(id_asistencia: int, db: Session = Depends(get_db)):
    item = db.query(Asistencia).filter(Asistencia.id_asistencia == id_asistencia).first()
    if not item:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")
    item.estado = EstadoAsistencia.atendido
    db.commit()
    db.refresh(item)
    return item
