from sqlalchemy import Column, Integer, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from App.DataBase.connection import Base
import enum

class EstadoPedido(str, enum.Enum):
    pendiente = "pendiente"
    en_preparacion = "en_preparacion"
    listo_para_servir = "listo_para_servir"
    servido = "servido"
    pagado = "pagado"
    cancelado = "cancelado"

class Pedido(Base):
    __tablename__ = "pedidos"

    id_pedido = Column(Integer, primary_key=True, autoincrement=True)
    id_restaurante = Column(Integer, ForeignKey("restaurantes.id_restaurante", ondelete="CASCADE"), nullable=False, index=True)
    fecha_hora = Column(DateTime, server_default=func.now())
    estado = Column(Enum(EstadoPedido), default=EstadoPedido.pendiente)

    id_mesa = Column(Integer, ForeignKey("mesas.id_mesa"), nullable=False)
    id_comensal = Column(Integer, ForeignKey("comensales.id_comensal"), nullable=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)

    # Pago que cubre este pedido. Cuando la caja cobra una mesa completa, un
    # mismo pago cubre todos los pedidos de esa mesa; `Pago.id_pedido` solo
    # apunta al primero de ellos porque es una columna UNIQUE.
    id_pago = Column(Integer, ForeignKey("pagos.id_pago"), nullable=True, index=True)

    # Relaciones
    restaurante = relationship("Restaurante", back_populates="pedidos")
    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")
    # Hay dos caminos de clave foránea entre pedidos y pagos, así que cada
    # relación tiene que decir por cuál va.
    pago = relationship(
        "Pago", back_populates="pedido", uselist=False, foreign_keys="Pago.id_pedido"
    )
    pago_cubierto = relationship(
        "Pago", back_populates="pedidos_cubiertos", foreign_keys="Pedido.id_pago"
    )
    mesa = relationship("Mesa", back_populates="pedidos")
    comensal = relationship("Comensal", back_populates="pedidos")
    usuario = relationship("Usuario", back_populates="pedidos")