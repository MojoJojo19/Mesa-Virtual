from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime

class PagoCreate(BaseModel):
    monto_total: Decimal
    propina: Decimal | None = None
    metodo_pago: str
    id_pedido: int

class PagoResponse(BaseModel):
    id_pago: int
    monto_total: Decimal
    propina: Decimal | None = None
    metodo_pago: str
    fecha_pago: datetime
    id_pedido: int

    class Config:
        from_attributes = True
