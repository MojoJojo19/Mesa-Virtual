from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from App.DataBase.connection import Base

class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, autoincrement=True)
    id_restaurante = Column(Integer, ForeignKey("restaurantes.id_restaurante", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    estado = Column(String(20), default="disponible")

    id_categoria = Column(Integer, ForeignKey("categorias.id_categoria"), nullable=False)

    # Relaciones
    restaurante = relationship("Restaurante", back_populates="productos")
    categoria = relationship("Categoria", back_populates="productos")
    detalles = relationship("DetallePedido", back_populates="producto")