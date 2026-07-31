from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.mesa import Mesa, EstadoMesa
from App.Models.comensal import Comensal
from App.Schemas.mesa import (
    MesaCreate, MesaResponse, MesaCreateResponse,
    ValidarPinRequest, ValidarPinResponse, MesaEstadoUpdate
)
from App.Schemas.comensal import ComensalResponse
from App.Utils.qr_generator import generar_qr_mesa
from App.Utils.pin_generator import generar_pin

from App.Models.usuario import Usuario
from App.Core.security import obtener_usuario_actual

router = APIRouter(prefix="/api/mesas", tags=["Mesas"])


@router.post("/", response_model=MesaCreateResponse)
def crear_mesa(
    datos: MesaCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    # El restaurante sale del token, no de un parámetro: antes cualquiera
    # podía crear una mesa en el local de otro pasando otro id.
    # 1. Crear mesa en BD (sin QR ni PIN al principio)
    nuevo = Mesa(**datos.model_dump(), id_restaurante=usuario_actual.id_restaurante)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    # 2. Ahora que tenemos el ID (ej. Mesa #1), generamos su QR y su PIN de acceso
    nuevo.codigo_qr = generar_qr_mesa(nuevo.id_mesa)
    nuevo.pin = generar_pin()
    db.commit()
    db.refresh(nuevo)

    return nuevo


@router.get("/", response_model=List[MesaResponse])
def listar_mesas(id_restaurante: int = None, db: Session = Depends(get_db)):
    query = db.query(Mesa)
    if id_restaurante is not None:
        query = query.filter(Mesa.id_restaurante == id_restaurante)
    return query.all()


@router.get("/gestion", response_model=List[MesaCreateResponse])
def listar_mesas_gestion(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    """
    Listado para el panel de administración: incluye el PIN y la ruta del QR.

    Va aparte de GET / porque `MesaResponse` oculta el PIN a propósito — ese
    endpoint es público y cualquier comensal podría leer el PIN de las otras
    mesas. Aquí el restaurante sale del token, no de un parámetro.

    OJO: tiene que declararse ANTES de /{id_mesa}, o FastAPI intentaría
    interpretar "gestion" como un id de mesa.
    """
    return db.query(Mesa).filter(
        Mesa.id_restaurante == usuario_actual.id_restaurante
    ).order_by(Mesa.numero).all()


@router.get("/{id_mesa}", response_model=MesaResponse)
def obtener_mesa(id_mesa: int, db: Session = Depends(get_db)):
    item = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not item:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    return item


@router.put("/{id_mesa}/estado", response_model=MesaResponse)
def actualizar_estado_mesa(id_mesa: int, datos: MesaEstadoUpdate, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    mesa.estado = datos.estado
    db.commit()
    db.refresh(mesa)
    return mesa


@router.post("/{id_mesa}/validar-pin", response_model=ValidarPinResponse)
def validar_pin(id_mesa: int, datos: ValidarPinRequest, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    return {"valido": mesa.pin == datos.pin}


@router.get("/{id_mesa}/comensales", response_model=List[ComensalResponse])
def listar_comensales_de_mesa(id_mesa: int, db: Session = Depends(get_db)):
    """
    Endpoint para el Lobby: devuelve los comensales reales unidos a la mesa,
    reemplazando la data mock (Carlos, Ana, Luis) que tiene hoy el frontend.
    """
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    return db.query(Comensal).filter(Comensal.id_mesa == id_mesa).all()


@router.post("/{id_mesa}/liberar", response_model=MesaResponse)
def liberar_mesa(
    id_mesa: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
):
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    
    # 1. Cambiar estado a libre
    mesa.estado = EstadoMesa.libre
    # 2. Generar un nuevo PIN aleatorio
    mesa.pin = generar_pin()
    # 3. Eliminar los comensales asociados a esta mesa (limpiar la sesión)
    mesa.comensales.clear()
    
    # 4. Cerrar los pedidos que sigan abiertos.
    #    Antes se marcaban como "pagado" sin que existiera fila en `pagos`, así
    #    que la caja cuadraba con ventas que nunca ocurrieron. Si llegan aquí
    #    sin pago es porque la mesa se liberó sin cobrar: eso es una anulación.
    #    Los que sí se cobraron ya quedaron en "pagado" desde /api/pagos.
    from App.Models.pedido import Pedido, EstadoPedido
    pedidos_abiertos = db.query(Pedido).filter(
        Pedido.id_mesa == id_mesa,
        Pedido.id_pago.is_(None),
        Pedido.estado.in_([
            EstadoPedido.pendiente,
            EstadoPedido.en_preparacion,
            EstadoPedido.listo_para_servir,
            EstadoPedido.servido,
        ])
    ).all()
    for ped in pedidos_abiertos:
        ped.estado = EstadoPedido.cancelado

    db.commit()
    db.refresh(mesa)
    return mesa

