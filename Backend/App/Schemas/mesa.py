from typing import Optional, List
from pydantic import BaseModel
from App.Schemas.comensal import ComensalResponse

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
    token_sesion: Optional[str] = None
    restaurante: Optional[RestauranteMini] = None
    comensales: Optional[List[ComensalResponse]] = None

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


# ── Búsqueda de mesa por PIN (acceso manual desde la pantalla de inicio) ──────
class BuscarPorPinRequest(BaseModel):
    pin: str

class BuscarPorPinResponse(BaseModel):
    encontrado: bool
    id_mesa: Optional[int] = None
    numero_mesa: Optional[int] = None
    nombre_restaurante: Optional[str] = None

    class Config:
        from_attributes = True
