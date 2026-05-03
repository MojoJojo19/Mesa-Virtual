from sqlalchemy import Column, Integer, String, Enum
from App.DataBase.connection import Base
import enum

# Definimos los roles y estados según tu diagrama
class RolUsuario(str, enum.Enum):
    admin = "admin"
    mesero = "mesero"

class EstadoUsuario(str, enum.Enum):
    activo = "activo"
    inactivo = "inactivo"

class Usuario(Base):
    __tablename__ = "usuarios" # Nombre de la tabla en Postgres

    # Mapeo exacto de tu diagrama:
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(150), unique=True, nullable=False)
    contrasena = Column(String(255), nullable=False)
    rol = Column(Enum(RolUsuario), nullable=False)
    estado = Column(Enum(EstadoUsuario), default=EstadoUsuario.activo)
