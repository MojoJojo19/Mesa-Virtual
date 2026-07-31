from typing import Optional
from pydantic import BaseModel
from decimal import Decimal

class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    id_categoria: int

class ProductoUpdate(BaseModel):
    """
    Edición parcial desde el panel. Todo es opcional para poder cambiar solo
    el precio, o solo el estado (que es como se reactiva un plato retirado:
    con ProductoCreate no había forma de volver a ponerlo disponible).
    """
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[Decimal] = None
    id_categoria: Optional[int] = None
    estado: Optional[str] = None

class ProductoResponse(BaseModel):
    id_producto: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    estado: str
    id_categoria: int

    class Config:
        from_attributes = True
