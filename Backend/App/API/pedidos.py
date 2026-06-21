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
    nuevo = Pedido(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=list[PedidoResponse])
def listar_pedidos(db: Session = Depends(get_db)):
    return db.query(Pedido).all()

@router.get("/mesa/{id_mesa}", response_model=list[PedidoResponse])
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