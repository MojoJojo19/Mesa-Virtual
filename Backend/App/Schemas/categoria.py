from typing import Optional
from pydantic import BaseModel

class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CategoriaResponse(BaseModel):
    id_categoria: int
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True
