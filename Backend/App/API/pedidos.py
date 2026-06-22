from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.pedido import Pedido, EstadoPedido
from App.Models.detalle_pedido import DetallePedido
from App.Models.producto import Producto
from App.Schemas.pedido import PedidoCreate, PedidoResponse

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])

@router.post("/", response_model=PedidoResponse)
def crear_pedido(datos: PedidoCreate, db: Session = Depends(get_db)):
    from App.Models.mesa import Mesa
    from App.Models.detalle_pedido import DetallePedido
    from App.Models.producto import Producto

    mesa = db.query(Mesa).filter(Mesa.id_mesa == datos.id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    dict_datos = datos.model_dump()
    items_datos = dict_datos.pop("items", None)

    nuevo = Pedido(**dict_datos, id_restaurante=mesa.id_restaurante, estado=EstadoPedido.pendiente)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    if items_datos:
        for item in items_datos:
            id_prod = item["id_producto"]
            cant = item["cantidad"]
            producto = db.query(Producto).filter(Producto.id_producto == id_prod).first()
            if not producto:
                continue
            precio = producto.precio
            subtotal = precio * cant
            detalle = DetallePedido(
                id_pedido=nuevo.id_pedido,
                id_producto=id_prod,
                cantidad=cant,
                precio_unitario=precio,
                subtotal=subtotal
            )
            db.add(detalle)
        db.commit()
        db.refresh(nuevo)

    return nuevo

@router.get("/", response_model=List[PedidoResponse])
def listar_pedidos(id_restaurante: int = None, db: Session = Depends(get_db)):
    query = db.query(Pedido)
    if id_restaurante is not None:
        query = query.filter(Pedido.id_restaurante == id_restaurante)
    return query.all()

@router.get("/mesa/{id_mesa}", response_model=List[PedidoResponse])
def pedidos_por_mesa(id_mesa: int, db: Session = Depends(get_db)):
    return db.query(Pedido).filter(Pedido.id_mesa == id_mesa).all()

@router.put("/{id}/estado", response_model=PedidoResponse)
def actualizar_estado_pedido(id: int, nuevo_estado: EstadoPedido, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id_pedido == id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    pedido.estado = nuevo_estado
    db.commit()
    db.refresh(pedido)
    return pedido