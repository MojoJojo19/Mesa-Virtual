from pydantic import BaseModel

class MesaCreate(BaseModel):
    numero: int

class MesaResponse(BaseModel):
    id_mesa: int
    numero: int
    estado: str
    codigo_qr: str | None = None

    class Config:
        from_attributes = True
