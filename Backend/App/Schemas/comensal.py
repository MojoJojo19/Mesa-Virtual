from pydantic import BaseModel

class ComensalCreate(BaseModel):
    nombre: str
    avatar: str | None = None
    id_mesa: int

class ComensalResponse(BaseModel):
    id_comensal: int
    nombre: str
    avatar: str | None = None
    estado_sesion: str
    id_mesa: int

    class Config:
        from_attributes = True
