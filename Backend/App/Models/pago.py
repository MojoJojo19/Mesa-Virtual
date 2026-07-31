from sqlalchemy import Column, Integer, Numeric, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from App.DataBase.connection import Base
import enum

class MetodoPago(str, enum.Enum):
    efectivo = "efectivo"
    tarjeta = "tarjeta"
    yape = "yape"
    plin = "plin"

class Pago(Base):
    __tablename__ = "pagos"

    id_pago = Column(Integer, primary_key=True, autoincrement=True)
    id_restaurante = Column(Integer, ForeignKey("restaurantes.id_restaurante", ondelete="CASCADE"), nullable=False, index=True)
    monto_total = Column(Numeric(10, 2), nullable=False)
    propina = Column(Numeric(10, 2), nullable=True)
    metodo_pago = Column(Enum(MetodoPago), nullable=False)
    fecha_pago = Column(DateTime, server_default=func.now())

    id_pedido = Column(Integer, ForeignKey("pedidos.id_pedido"), unique=True, nullable=False)

    # Relaciones
    restaurante = relationship("Restaurante", back_populates="pagos")
    pedido = relationship("Pedido", back_populates="pago")

    # --- Datos derivados del pedido ---
    # La caja y la boleta necesitan saber de qué mesa salió el pago y qué se
    # consumió. Ambos viven en el pedido, así que se exponen desde aquí en vez
    # de duplicar columnas en la tabla de pagos.

    @property
    def id_mesa(self):
        return self.pedido.id_mesa if self.pedido else None

    @property
    def items(self):
        if not self.pedido:
            return []
        return [
            {
                "nombre": d.producto.nombre if d.producto else "Producto #%s" % d.id_producto,
                "cantidad": d.cantidad,
                "precio": d.precio_unitario,
            }
            for d in self.pedido.detalles
        ]
    
