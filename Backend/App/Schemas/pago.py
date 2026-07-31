from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime

class PagoCreate(BaseModel):
    monto_total: Decimal
    propina: Optional[Decimal] = None
    metodo_pago: str
    id_pedido: int

class PagoItem(BaseModel):
    nombre: str
    cantidad: int
    precio: Decimal

class PagoResponse(BaseModel):
    id_pago: int
    monto_total: Decimal
    propina: Optional[Decimal] = None
    metodo_pago: str
    fecha_pago: datetime
    id_pedido: int
    # Derivados del pedido (ver propiedades en Models/pago.py): la caja los
    # mostraba como "undefined" porque no viajaban en la respuesta.
    id_mesa: Optional[int] = None
    items: List[PagoItem] = []

    class Config:
        from_attributes = True
