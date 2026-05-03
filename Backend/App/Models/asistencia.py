from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from App.DataBase.connection import Base
import enum

class TipoAsistencia(str, enum.Enum):
    llamar_mesero = "llamar_mesero"
    pedir_cuenta = "pedir_cuenta"

class Asistencia(Base):
    __tablename__ = "asistencias"

    id_asistencia = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(Enum(TipoAsistencia), nullable=False)
    estado = Column(String(20), default="pendiente")
    fecha_hora = Column(DateTime, server_default=func.now())
    
    id_mesa = Column(Integer, ForeignKey("mesas.id_mesa"), nullable=False)
