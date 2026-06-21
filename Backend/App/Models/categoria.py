from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from App.DataBase.connection import Base

class Categoria(Base):
    __tablename__ = "categorias"

    id_categoria = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)

    productos = relationship("Producto", back_populates="categoria")