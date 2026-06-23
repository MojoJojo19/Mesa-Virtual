import uuid
import qrcode
from io import BytesIO
from fastapi.responses import StreamingResponse
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.mesa import Mesa, EstadoMesa
from App.Models.comensal import Comensal
from App.Schemas.mesa import (
    MesaCreate, MesaResponse, MesaCreateResponse,
    ValidarPinRequest, ValidarPinResponse, MesaEstadoUpdate,
    BuscarPorPinRequest, BuscarPorPinResponse
)
from App.Schemas.comensal import ComensalResponse
from App.Utils.qr_generator import generar_qr_mesa
from App.Utils.pin_generator import generar_pin

router = APIRouter(prefix="/api/mesas", tags=["Mesas"])


@router.post("/", response_model=MesaCreateResponse)
def crear_mesa(datos: MesaCreate, id_restaurante: int, db: Session = Depends(get_db)):
    # 1. Crear mesa en BD (sin QR ni PIN al principio)
    nuevo = Mesa(**datos.model_dump(), id_restaurante=id_restaurante)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    # 2. Ahora que tenemos el ID (ej. Mesa #1), generamos su QR y su PIN de acceso
    nuevo.codigo_qr = generar_qr_mesa(nuevo.id_mesa)
    nuevo.pin = generar_pin()
    nuevo.token_sesion = uuid.uuid4().hex[:8]
    db.commit()
    db.refresh(nuevo)

    return nuevo


@router.get("/", response_model=List[MesaResponse])
def listar_mesas(id_restaurante: int = None, db: Session = Depends(get_db)):
    query = db.query(Mesa)
    if id_restaurante is not None:
        query = query.filter(Mesa.id_restaurante == id_restaurante)
    return query.all()


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


@router.get("/{id_mesa}/validar-token")
def validar_token(id_mesa: int, token: str, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    return {"valido": mesa.token_sesion == token}


@router.get("/{id_mesa}/qr_imagen")
def obtener_qr_imagen(id_mesa: int, host: str = "http://localhost:5173", db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    
    if not mesa.token_sesion:
        mesa.token_sesion = uuid.uuid4().hex[:8]
        db.commit()
        db.refresh(mesa)
    
    url_mesa = f"{host}/mesa/{mesa.id_mesa}?token={mesa.token_sesion}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url_mesa)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


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


@router.post("/buscar-por-pin", response_model=BuscarPorPinResponse)
def buscar_mesa_por_pin(datos: BuscarPorPinRequest, db: Session = Depends(get_db)):
    """
    Permite al cliente ingresar manualmente en la app usando solo el PIN
    de 4 dígitos impreso en el centro de mesa, sin necesitar conocer el id_mesa.
    Devuelve el id_mesa y el número de mesa si el PIN es válido.
    """
    # Buscar primero en mesas activas (ocupadas)
    mesa = db.query(Mesa).filter(
        Mesa.pin == datos.pin,
        Mesa.estado != EstadoMesa.libre
    ).first()

    # Búsqueda más permisiva: incluir mesas libres (por si el PIN aún no fue activado)
    if not mesa:
        mesa = db.query(Mesa).filter(Mesa.pin == datos.pin).first()

    if not mesa:
        return BuscarPorPinResponse(encontrado=False)

    nombre_rest = None
    if mesa.restaurante:
        nombre_rest = mesa.restaurante.nombre

    return BuscarPorPinResponse(
        encontrado=True,
        id_mesa=mesa.id_mesa,
        numero_mesa=mesa.numero,
        nombre_restaurante=nombre_rest
    )


@router.post("/{id_mesa}/liberar", response_model=MesaResponse)
def liberar_mesa(id_mesa: int, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.id_mesa == id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    
    # 1. Cambiar estado a libre
    mesa.estado = EstadoMesa.libre
    # 2. Generar un nuevo PIN aleatorio
    mesa.pin = generar_pin()
    # Generar un nuevo token de sesión
    mesa.token_sesion = uuid.uuid4().hex[:8]
    # 3. Eliminar los comensales asociados a esta mesa (limpiar la sesión)
    mesa.comensales.clear()
    
    # 4. Marcar pedidos activos como pagados para cerrar la cuenta de la mesa
    from App.Models.pedido import Pedido, EstadoPedido
    pedidos_activos = db.query(Pedido).filter(
        Pedido.id_mesa == id_mesa,
        Pedido.estado.in_([EstadoPedido.pendiente, EstadoPedido.en_preparacion, EstadoPedido.servido])
    ).all()
    for ped in pedidos_activos:
        ped.estado = EstadoPedido.pagado
    
    db.commit()
    db.refresh(mesa)
    return mesa

