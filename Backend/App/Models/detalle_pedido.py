from sqlalchemy import Column, Integer, Numeric, ForeignKey
from App.DataBase.connection import Base

class DetallePedido(Base):
    __tablename__ = "detalles_pedido"

    id_detalle = Column(Integer, primary_key=True, autoincrement=True)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    
    id_pedido = Column(Integer, ForeignKey("pedidos.id_pedido"), nullable=False)
    id_producto = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
