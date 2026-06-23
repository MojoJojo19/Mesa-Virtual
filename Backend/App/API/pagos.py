from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.pago import Pago
from App.Schemas.pago import PagoCreate, PagoResponse

router = APIRouter(prefix="/api/pagos", tags=["Pagos"])

@router.post("/", response_model=PagoResponse)
def crear_pago(datos: PagoCreate, db: Session = Depends(get_db)):
    from App.Models.pedido import Pedido, EstadoPedido
    from App.Models.mesa import Mesa, EstadoMesa
    from App.Models.comensal import Comensal

    pedido = db.query(Pedido).filter(Pedido.id_pedido == datos.id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
    nuevo = Pago(**datos.model_dump(), id_restaurante=pedido.id_restaurante)
    db.add(nuevo)
    
    # Marcar el pedido como pagado
    pedido.estado = EstadoPedido.pagado
    db.commit()

    # Evaluar si la mesa debe cerrarse
    mesa = db.query(Mesa).filter(Mesa.id_mesa == pedido.id_mesa).first()
    if mesa:
        pedidos_pendientes = db.query(Pedido).filter(
            Pedido.id_mesa == mesa.id_mesa,
            Pedido.estado.notin_([EstadoPedido.pagado, EstadoPedido.cancelado])
        ).count()

        if pedidos_pendientes == 0:
            debe_cerrar = False
            if mesa.tipo_pago == 'junto':
                debe_cerrar = True
            else:
                comensales_pendientes = db.query(Comensal).filter(
                    Comensal.id_mesa == mesa.id_mesa,
                    Comensal.estado_pedido.in_(['eligiendo', 'listo'])
                ).count()
                if comensales_pendientes == 0:
                    debe_cerrar = True
            
            if debe_cerrar:
                mesa.estado = EstadoMesa.libre
                mesa.tipo_pago = "no_decidido"
                mesa.comensales.clear()
                db.commit()

    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=List[PagoResponse])
def listar_pagos(id_restaurante: int = None, db: Session = Depends(get_db)):
    query = db.query(Pago)
    if id_restaurante is not None:
        query = query.filter(Pago.id_restaurante == id_restaurante)
    return query.all()
