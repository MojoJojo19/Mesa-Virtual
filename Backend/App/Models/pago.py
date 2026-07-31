from decimal import Decimal
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
    pedido = relationship(
        "Pedido", back_populates="pago", foreign_keys="Pago.id_pedido"
    )
    # Todos los pedidos que cubre este pago. Al cobrar una mesa completa son
    # varios; `id_pedido` es UNIQUE y solo puede apuntar a uno.
    pedidos_cubiertos = relationship(
        "Pedido", back_populates="pago_cubierto", foreign_keys="Pedido.id_pago"
    )

    # --- Datos derivados de los pedidos ---
    # La caja y la boleta necesitan saber de qué mesa salió el pago y qué se
    # consumió. Ambos viven en el pedido, así que se exponen desde aquí en vez
    # de duplicar columnas en la tabla de pagos.

    @property
    def _pedidos(self):
        """
        Los pedidos que hay que leer para armar la boleta.

        Los pagos creados al cobrar una mesa completa traen `pedidos_cubiertos`;
        los antiguos (y los de un solo pedido) solo tienen `pedido`.
        """
        if self.pedidos_cubiertos:
            return self.pedidos_cubiertos
        return [self.pedido] if self.pedido else []

    @property
    def id_mesa(self):
        pedidos = self._pedidos
        return pedidos[0].id_mesa if pedidos else None

    @property
    def items(self):
        return [
            {
                "nombre": d.producto.nombre if d.producto else "Producto #%s" % d.id_producto,
                "cantidad": d.cantidad,
                "precio": d.precio_unitario,
            }
            for pedido in self._pedidos
            for d in pedido.detalles
        ]

    @property
    def subtotal(self):
        """Consumo puro, sin el recargo por servicio ni la propina."""
        total = Decimal("0")
        for pedido in self._pedidos:
            for d in pedido.detalles:
                total += d.subtotal or Decimal("0")
        return total
    
