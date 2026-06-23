from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from App.DataBase.connection import Base

class Restaurante(Base):
    __tablename__ = "restaurantes"

    id_restaurante = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    ruc = Column(String(11), unique=True, nullable=False)
    direccion = Column(String(255), nullable=True)
    telefono = Column(String(20), nullable=True)
    estado = Column(String(20), default="activo")
    tiempo_espera_global = Column(Integer, default=15)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones de cascada
    mesas = relationship("Mesa", back_populates="restaurante", cascade="all, delete-orphan")
    categorias = relationship("Categoria", back_populates="restaurante", cascade="all, delete-orphan")
    usuarios = relationship("Usuario", back_populates="restaurante", cascade="all, delete-orphan")
    asistencias = relationship("Asistencia", back_populates="restaurante", cascade="all, delete-orphan")
    comensales = relationship("Comensal", back_populates="restaurante", cascade="all, delete-orphan")
    productos = relationship("Producto", back_populates="restaurante", cascade="all, delete-orphan")
    pedidos = relationship("Pedido", back_populates="restaurante", cascade="all, delete-orphan")
    pagos = relationship("Pago", back_populates="restaurante", cascade="all, delete-orphan")
