from sqlalchemy import Column, Integer, String, Enum, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from App.DataBase.connection import Base
import enum

class EstadoSesion(str, enum.Enum):
    activa = "activa"
    inactiva = "inactiva"

class Comensal(Base):
    __tablename__ = "comensales"

    id_comensal = Column(Integer, primary_key=True, autoincrement=True)
    id_restaurante = Column(Integer, ForeignKey("restaurantes.id_restaurante", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    avatar = Column(String(255), nullable=True)
    estado_sesion = Column(Enum(EstadoSesion), default=EstadoSesion.activa)

    # index=True: se filtra constantemente "dame los comensales de esta mesa" (lobby)
    id_mesa = Column(Integer, ForeignKey("mesas.id_mesa"), nullable=False, index=True)

    is_lider = Column(Boolean, default=False)

    # Estado temporal de compra
    estado_pedido = Column(String(20), default="eligiendo") # "eligiendo" o "listo"
    carrito = Column(JSON, default=list) # Guarda el array de items en formato JSON

    # --- Relaciones ---
    restaurante = relationship("Restaurante", back_populates="comensales")
    mesa = relationship("Mesa", back_populates="comensales")
    pedidos = relationship("Pedido", back_populates="comensal")


    # NOTA: Comensal -> Pedido y Comensal -> Pago se agregan en conjunto con Match,
    # cuando él tenga el back_populates listo del lado de Pedido/Pago.
