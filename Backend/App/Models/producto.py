from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from App.DataBase.connection import Base

class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    estado = Column(String(20), default="disponible")
    
    id_categoria = Column(Integer, ForeignKey("categorias.id_categoria"), nullable=False)
