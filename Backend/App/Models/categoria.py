from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from App.DataBase.connection import Base

class Categoria(Base):
    __tablename__ = "categorias"

    id_categoria = Column(Integer, primary_key=True, autoincrement=True)
    id_restaurante = Column(Integer, ForeignKey("restaurantes.id_restaurante", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)

    # Relaciones
    restaurante = relationship("Restaurante", back_populates="categorias")
    productos = relationship("Producto", back_populates="categoria")