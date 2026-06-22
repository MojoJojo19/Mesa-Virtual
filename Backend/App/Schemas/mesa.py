from typing import Optional
from pydantic import BaseModel

class MesaCreate(BaseModel):
    numero: int

class RestauranteMini(BaseModel):
    id_restaurante: int
    nombre: str

    class Config:
        from_attributes = True

class MesaResponse(BaseModel):
    id_mesa: int
    id_restaurante: int
    numero: int
    estado: str
    codigo_qr: Optional[str] = None
    restaurante: Optional[RestauranteMini] = None

    class Config:
        from_attributes = True

class MesaCreateResponse(MesaResponse):
    # Este sí incluye el pin: solo se devuelve una vez, justo al crear la
    # mesa, para que el mesero/admin lo anote o lo imprima junto al QR.
    pin: Optional[str] = None

class ValidarPinRequest(BaseModel):
    pin: str

class ValidarPinResponse(BaseModel):
    valido: bool

class MesaEstadoUpdate(BaseModel):
    estado: str
