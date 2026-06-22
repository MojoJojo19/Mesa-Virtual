from typing import Optional
from pydantic import BaseModel

class ComensalCreate(BaseModel):
    nombre: str
    avatar: Optional[str] = None
    id_mesa: int

class ComensalResponse(BaseModel):
    id_comensal: int
    nombre: str
    avatar: Optional[str] = None
    estado_sesion: str
    id_mesa: int

    class Config:
        from_attributes = True
