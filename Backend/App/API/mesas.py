from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.mesa import Mesa
from App.Models.comensal import Comensal
from App.Schemas.mesa import (
    MesaCreate, MesaResponse, MesaCreateResponse,
    ValidarPinRequest, ValidarPinResponse, MesaEstadoUpdate
)
from App.Schemas.comensal import ComensalResponse
from App.Utils.qr_generator import generar_qr_mesa
from App.Utils.pin_generator import generar_pin

router = APIRouter(prefix="/api/mesas", tags=["Mesas"])


@router.post("/", response_model=MesaCreateResponse)
def crear_mesa(datos: MesaCreate, db: Session = Depends(get_db)):
    # 1. Crear mesa en BD (sin QR ni PIN al principio)
    nuevo = Mesa(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    # 2. Ahora que tenemos el ID (ej. Mesa #1), generamos su QR y su PIN de acceso
    nuevo.codigo_qr = generar_qr_mesa(nuevo.id_mesa)
    nuevo.pin = generar_pin()
    db.commit()
    db.refresh(nuevo)

    return nuevo


@router.get("/", response_model=list[MesaResponse])
def listar_mesas(db: Session = Depends(get_db)):
    return db.query(Mesa).all()


@router.get("/{id_mesa}", response_model=MesaResponse)
def obtener_mesa(id_mesa: int, db: Session = Depends(get_db)):
    item = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not item:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    return item


@router.put("/{id_mesa}/estado", response_model=MesaResponse)
def actualizar_estado_mesa(id_mesa: int, datos: MesaEstadoUpdate, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    mesa.estado = datos.estado
    db.commit()
    db.refresh(mesa)
    return mesa


@router.post("/{id_mesa}/validar-pin", response_model=ValidarPinResponse)
def validar_pin(id_mesa: int, datos: ValidarPinRequest, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    return {"valido": mesa.pin == datos.pin}


@router.get("/{id_mesa}/comensales", response_model=list[ComensalResponse])
def listar_comensales_de_mesa(id_mesa: int, db: Session = Depends(get_db)):
    """
    Endpoint para el Lobby: devuelve los comensales reales unidos a la mesa,
    reemplazando la data mock (Carlos, Ana, Luis) que tiene hoy el frontend.
    """
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    return db.query(Comensal).filter(Comensal.id_mesa == id_mesa).all()
