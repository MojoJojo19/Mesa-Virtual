from sqlalchemy import Column, Integer, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from App.DataBase.connection import Base
import enum

class EstadoPedido(str, enum.Enum):
    pendiente = "pendiente"
    en_preparacion = "en_preparacion"
    servido = "servido"
    pagado = "pagado"
    cancelado = "cancelado"

class Pedido(Base):
    __tablename__ = "pedidos"

    id_pedido = Column(Integer, primary_key=True, autoincrement=True)
    fecha_hora = Column(DateTime, server_default=func.now())
    estado = Column(Enum(EstadoPedido), default=EstadoPedido.pendiente)

    id_mesa = Column(Integer, ForeignKey("mesas.id_mesa"), nullable=False)
    id_comensal = Column(Integer, ForeignKey("comensales.id_comensal"), nullable=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)

    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")
    pago = relationship("Pago", back_populates="pedido", uselist=False)
    mesa = relationship("Mesa", back_populates="pedidos")
    comensal = relationship("Comensal", back_populates="pedidos")