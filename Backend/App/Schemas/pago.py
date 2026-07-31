from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime

class PagoCreate(BaseModel):
    monto_total: Decimal
    propina: Optional[Decimal] = None
    metodo_pago: str
    id_pedido: int

class PagoMesaCreate(BaseModel):
    """
    Cobro de una mesa completa. El monto no viaja desde el cliente: lo calcula
    el backend sumando los detalles de los pedidos activos, así la caja no
    puede cobrar un importe que no cuadre con lo consumido.
    """
    metodo_pago: str
    propina: Optional[Decimal] = None

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
    # Derivados de los pedidos cubiertos (ver propiedades en Models/pago.py):
    # la caja los mostraba como "undefined" porque no viajaban en la respuesta.
    id_mesa: Optional[int] = None
    items: List[PagoItem] = []
    # Consumo sin el recargo por servicio, para desglosar la boleta.
    subtotal: Decimal = Decimal("0")

    class Config:
        from_attributes = True
