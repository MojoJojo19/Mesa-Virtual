from decimal import Decimal, ROUND_HALF_UP
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.pago import Pago
from App.Models.mesa import Mesa
from App.Models.pedido import Pedido, EstadoPedido
from App.Models.usuario import Usuario
from App.Schemas.pago import PagoCreate, PagoMesaCreate, PagoResponse
from App.Core.security import obtener_usuario_actual

router = APIRouter(prefix="/api/pagos", tags=["Pagos"])

# Recargo por servicio que la carta ya le anuncia al comensal.
PORCENTAJE_SERVICIO = Decimal("0.10")

# Un pedido se puede cobrar mientras no esté ya pagado ni anulado.
ESTADOS_COBRABLES = [
    EstadoPedido.pendiente,
    EstadoPedido.en_preparacion,
    EstadoPedido.listo_para_servir,
    EstadoPedido.servido,
]


def _redondear(monto):
    """Dos decimales, redondeando como una caja: el medio centavo sube."""
    return monto.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@router.post("/", response_model=PagoResponse)
def crear_pago(
    datos: PagoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    pedido = db.query(Pedido).filter(Pedido.id_pedido == datos.id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    nuevo = Pago(**datos.model_dump(), id_restaurante=pedido.id_restaurante)
    db.add(nuevo)
    db.flush()

    # Aunque cubra un solo pedido, el vínculo queda explícito para que la
    # boleta se arme siempre por el mismo camino.
    pedido.id_pago = nuevo.id_pago
    pedido.estado = EstadoPedido.pagado

    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.post("/mesa/{id_mesa}", response_model=PagoResponse)
def cobrar_mesa(
    id_mesa: int,
    datos: PagoMesaCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    """
    Cobra de una sola vez todos los pedidos activos de una mesa.

    Antes la caja creaba el pago contra el primer pedido de la mesa aunque
    cobrara el total, así que la boleta solo listaba los platos de ese pedido
    y los demás quedaban marcados como pagados sin fila en `pagos`. Aquí un
    único pago queda vinculado a todos los pedidos que cubre.
    """
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    pedidos = (
        db.query(Pedido)
        .filter(Pedido.id_mesa == id_mesa, Pedido.estado.in_(ESTADOS_COBRABLES))
        .order_by(Pedido.id_pedido)
        .all()
    )
    if not pedidos:
        raise HTTPException(status_code=400, detail="La mesa no tiene pedidos por cobrar")

    subtotal = Decimal("0")
    for pedido in pedidos:
        for detalle in pedido.detalles:
            subtotal += detalle.subtotal or Decimal("0")

    # La propina va aparte del monto: la caja la reporta en su propia columna.
    monto_total = _redondear(subtotal * (Decimal("1") + PORCENTAJE_SERVICIO))
    propina = _redondear(datos.propina) if datos.propina else Decimal("0")

    nuevo = Pago(
        monto_total=monto_total,
        propina=propina,
        metodo_pago=datos.metodo_pago,
        # `id_pedido` es UNIQUE y no admite nulos, así que apunta al primero.
        # El vínculo con toda la cuenta es `Pedido.id_pago`, justo abajo.
        id_pedido=pedidos[0].id_pedido,
        id_restaurante=pedidos[0].id_restaurante,
    )
    db.add(nuevo)
    db.flush()  # necesitamos el id_pago antes de enlazar los pedidos

    for pedido in pedidos:
        pedido.id_pago = nuevo.id_pago
        pedido.estado = EstadoPedido.pagado

    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=List[PagoResponse])
def listar_pagos(
    id_restaurante: int = None,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    query = db.query(Pago)
    if id_restaurante is not None:
        query = query.filter(Pago.id_restaurante == id_restaurante)
    return query.all()
