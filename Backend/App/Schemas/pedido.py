from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class PedidoItemCreate(BaseModel):
    id_producto: int
    cantidad: int

class PedidoCreate(BaseModel):
    id_mesa: int
    id_comensal: Optional[int] = None
    id_usuario: Optional[int] = None
    items: Optional[List[PedidoItemCreate]] = None

class PedidoResponse(BaseModel):
    id_pedido: int
    fecha_hora: datetime
    estado: str
    id_mesa: int
    id_comensal: Optional[int] = None
    id_usuario: Optional[int] = None

    class Config:
        from_attributes = True
