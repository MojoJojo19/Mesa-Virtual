from pydantic import BaseModel
from datetime import datetime

class AsistenciaCreate(BaseModel):
    tipo: str
    id_mesa: int

class AsistenciaResponse(BaseModel):
    id_asistencia: int
    tipo: str
    estado: str
    fecha_hora: datetime
    id_mesa: int

    class Config:
        from_attributes = True
