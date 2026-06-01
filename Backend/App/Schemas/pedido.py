from pydantic import BaseModel
from datetime import datetime

class PedidoCreate(BaseModel):
    id_mesa: int
    id_comensal: int | None = None
    id_usuario: int | None = None

class PedidoResponse(BaseModel):
    id_pedido: int
    fecha_hora: datetime
    estado: str
    id_mesa: int
    id_comensal: int | None = None
    id_usuario: int | None = None

    class Config:
        from_attributes = True
