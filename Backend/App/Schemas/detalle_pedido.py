from pydantic import BaseModel
from decimal import Decimal

class DetallePedidoCreate(BaseModel):
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal
    id_pedido: int
    id_producto: int

class DetallePedidoResponse(BaseModel):
    id_detalle: int
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal
    id_pedido: int
    id_producto: int

    class Config:
        from_attributes = True
