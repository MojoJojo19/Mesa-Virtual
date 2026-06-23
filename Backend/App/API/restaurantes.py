from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.restaurante import Restaurante
from pydantic import BaseModel

router = APIRouter(prefix="/api/restaurantes", tags=["Restaurantes"])

class RestauranteDetalle(BaseModel):
    id_restaurante: int
    nombre: str
    tiempo_espera_global: int

    class Config:
        from_attributes = True

class TiempoEsperaUpdate(BaseModel):
    minutos: int

@router.get("/{id_restaurante}", response_model=RestauranteDetalle)
def obtener_restaurante(id_restaurante: int, db: Session = Depends(get_db)):
    restaurante = db.query(Restaurante).filter(Restaurante.id_restaurante == id_restaurante).first()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    return restaurante

@router.put("/{id_restaurante}/tiempo-espera")
def actualizar_tiempo_espera(id_restaurante: int, datos: TiempoEsperaUpdate, db: Session = Depends(get_db)):
    restaurante = db.query(Restaurante).filter(Restaurante.id_restaurante == id_restaurante).first()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")
    restaurante.tiempo_espera_global = datos.minutos
    db.commit()
    db.refresh(restaurante)
    return {"success": True, "tiempo_espera_global": restaurante.tiempo_espera_global}
