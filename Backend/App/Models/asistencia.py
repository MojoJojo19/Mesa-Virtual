from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from App.DataBase.connection import Base
import enum

class TipoAsistencia(str, enum.Enum):
    llamar_mesero = "llamar_mesero"
    pedir_cuenta = "pedir_cuenta"
    traer_cubiertos = "traer_cubiertos"
    traer_servilletas = "traer_servilletas"
    traer_hielo = "traer_hielo"
    retirar_platos = "retirar_platos"

class EstadoAsistencia(str, enum.Enum):
    pendiente = "pendiente"
    atendido = "atendido"

class Asistencia(Base):
    __tablename__ = "asistencias"

    id_asistencia = Column(Integer, primary_key=True, autoincrement=True)
    id_restaurante = Column(Integer, ForeignKey("restaurantes.id_restaurante", ondelete="CASCADE"), nullable=False, index=True)
    tipo = Column(Enum(TipoAsistencia), nullable=False)
    # Antes era String(20) suelto; lo pasamos a Enum para que no se puedan
    # guardar valores arbitrarios y sea consistente con el resto del proyecto.
    estado = Column(Enum(EstadoAsistencia), default=EstadoAsistencia.pendiente)
    fecha_hora = Column(DateTime(timezone=True), server_default=func.now())

    id_mesa = Column(Integer, ForeignKey("mesas.id_mesa"), nullable=False, index=True)

    # --- Relaciones ---
    restaurante = relationship("Restaurante", back_populates="asistencias")
    mesa = relationship("Mesa", back_populates="asistencias")
