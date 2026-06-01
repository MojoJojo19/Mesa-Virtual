from sqlalchemy import Column, Integer, String, Enum
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
