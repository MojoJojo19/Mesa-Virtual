from pydantic import BaseModel
from decimal import Decimal

class ProductoCreate(BaseModel):
    nombre: str
    descripcion: str | None = None
    precio: Decimal
    id_categoria: int

class ProductoResponse(BaseModel):
    id_producto: int
    nombre: str
    descripcion: str | None = None
    precio: Decimal
    estado: str
    id_categoria: int

    class Config:
        from_attributes = True
