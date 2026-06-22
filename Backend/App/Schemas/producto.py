from typing import Optional
from pydantic import BaseModel
from decimal import Decimal

class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    id_categoria: int

class ProductoResponse(BaseModel):
    id_producto: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    estado: str
    id_categoria: int

    class Config:
        from_attributes = True
