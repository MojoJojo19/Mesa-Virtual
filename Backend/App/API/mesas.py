from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.mesa import Mesa
from App.Schemas.mesa import MesaCreate, MesaResponse
from App.Utils.qr_generator import generar_qr_mesa

router = APIRouter(prefix="/api/mesas", tags=["Mesas"])

@router.post("/", response_model=MesaResponse)
def crear_mesa(datos: MesaCreate, db: Session = Depends(get_db)):
    # 1. Crear mesa en BD (sin QR al principio)
    nuevo = Mesa(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    
    # 2. Ahora que tenemos el ID (ej. Mesa #1), generamos su foto QR
    ruta_qr = generar_qr_mesa(nuevo.id_mesa)
    
    # 3. Guardamos la ruta de la foto en la base de datos
    nuevo.codigo_qr = ruta_qr
    db.commit()
    db.refresh(nuevo)
    
    return nuevo

@router.get("/", response_model=list[MesaResponse])
def listar_mesas(db: Session = Depends(get_db)):
    return db.query(Mesa).all()

@router.get("/{id}", response_model=MesaResponse)
def obtener_mesa(id: int, db: Session = Depends(get_db)):
    item = db.query(Mesa).filter(Mesa.id_mesa == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    return item
