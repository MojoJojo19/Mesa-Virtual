from sqlalchemy import Column, Integer, String, Enum, ForeignKey
from App.DataBase.connection import Base
import enum

class EstadoSesion(str, enum.Enum):
    activa = "activa"
    inactiva = "inactiva"

class Comensal(Base):
    __tablename__ = "comensales"

    id_comensal = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    avatar = Column(String(255), nullable=True)
    estado_sesion = Column(Enum(EstadoSesion), default=EstadoSesion.activa)
    
    id_mesa = Column(Integer, ForeignKey("mesas.id_mesa"), nullable=False)
