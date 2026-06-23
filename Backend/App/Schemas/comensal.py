from typing import Optional, List, Any
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
    estado_pedido: Optional[str] = "eligiendo"
    carrito: Optional[List[Any]] = []
    is_lider: bool = False

    class Config:
        from_attributes = True

class ComensalCarritoUpdate(BaseModel):
    estado_pedido: str
    carrito: List[Any]
