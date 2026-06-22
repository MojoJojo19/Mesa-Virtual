from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from App.DataBase.connection import Base
import enum

class EstadoMesa(str, enum.Enum):
    libre = "libre"
    ocupada = "ocupada"
    por_limpiar = "por_limpiar"

class Mesa(Base):
    __tablename__ = "mesas"

    id_mesa = Column(Integer, primary_key=True, autoincrement=True)
    numero = Column(Integer, nullable=False, unique=True)
    estado = Column(Enum(EstadoMesa), default=EstadoMesa.libre)
    codigo_qr = Column(String(255), unique=True, nullable=True)

    # PIN de 4 dígitos autogenerado al crear la mesa (HU-01: control de acceso a la sesión)
    pin = Column(String(4), nullable=True)

    # --- Relaciones (Bloque 1) ---
    comensales = relationship("Comensal", back_populates="mesa", cascade="all, delete-orphan")
    asistencias = relationship("Asistencia", back_populates="mesa", cascade="all, delete-orphan")
    pedidos = relationship("Pedido", back_populates="mesa")


    # NOTA: la relación Mesa -> Pedido se agrega en conjunto con Match (Bloque 2),
    # porque requiere que Pedido tenga su lado del back_populates ya definido.
