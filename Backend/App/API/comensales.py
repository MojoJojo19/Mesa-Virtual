from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.comensal import Comensal, EstadoSesion
from App.Schemas.comensal import ComensalCreate, ComensalResponse, ComensalCarritoUpdate

router = APIRouter(prefix="/api/comensales", tags=["Comensales"])


@router.post("/", response_model=ComensalResponse)
def crear_comensal(datos: ComensalCreate, db: Session = Depends(get_db)):
    from App.Models.mesa import Mesa, EstadoMesa
    mesa = db.query(Mesa).filter(Mesa.id_mesa == datos.id_mesa).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    
    # Validar nombre único en sesión activa
    comensal_existente = db.query(Comensal).filter(
        Comensal.id_mesa == datos.id_mesa,
        Comensal.estado_sesion == EstadoSesion.activa,
        Comensal.nombre.ilike(datos.nombre)
    ).first()
    
    if comensal_existente:
        raise HTTPException(status_code=400, detail="Este nombre ya está en uso en esta mesa.")
    
    # Cambiar el estado de la mesa a 'ocupada' al ingresar el comensal (HU-01)
    mesa.estado = EstadoMesa.ocupada
    
    nuevo = Comensal(**datos.model_dump(), id_restaurante=mesa.id_restaurante)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=List[ComensalResponse])
def listar_comensales(id_restaurante: int = None, db: Session = Depends(get_db)):
    query = db.query(Comensal)
    if id_restaurante is not None:
        query = query.filter(Comensal.id_restaurante == id_restaurante)
    return query.all()


@router.get("/{id_comensal}", response_model=ComensalResponse)
def obtener_comensal(id_comensal: int, db: Session = Depends(get_db)):
    item = db.query(Comensal).filter(Comensal.id_comensal == id_comensal).first()
    if not item:
        raise HTTPException(status_code=404, detail="Comensal no encontrado")
    return item


@router.put("/{id_comensal}/cerrar-sesion", response_model=ComensalResponse)
def cerrar_sesion_comensal(id_comensal: int, db: Session = Depends(get_db)):
    """
    No borramos al comensal (rompería el historial de sus pedidos/pagos),
    solo marcamos su sesión como inactiva.
    """
    item = db.query(Comensal).filter(Comensal.id_comensal == id_comensal).first()
    if not item:
        raise HTTPException(status_code=404, detail="Comensal no encontrado")
    item.estado_sesion = EstadoSesion.inactiva
    db.commit()
    db.refresh(item)
    return item

@router.put("/{id_comensal}/carrito", response_model=ComensalResponse)
def actualizar_carrito_comensal(id_comensal: int, datos: ComensalCarritoUpdate, db: Session = Depends(get_db)):
    """
    Actualiza el carrito temporal y el estado ('eligiendo' o 'listo') del comensal.
    """
    item = db.query(Comensal).filter(Comensal.id_comensal == id_comensal).first()
    if not item:
        raise HTTPException(status_code=404, detail="Comensal no encontrado")
    
    item.estado_pedido = datos.estado_pedido
    item.carrito = datos.carrito
    db.commit()
    db.refresh(item)
    return item

@router.put("/{id_comensal}/hacer-lider", response_model=ComensalResponse)
def hacer_lider(id_comensal: int, db: Session = Depends(get_db)):
    """
    Asigna a este comensal como líder de la mesa si es que la mesa aún no tiene líder.
    """
    item = db.query(Comensal).filter(Comensal.id_comensal == id_comensal).first()
    if not item:
        raise HTTPException(status_code=404, detail="Comensal no encontrado")
    
    # Verificar si ya hay un líder activo en esta mesa
    lider_existente = db.query(Comensal).filter(
        Comensal.id_mesa == item.id_mesa,
        Comensal.is_lider == True,
        Comensal.estado_sesion == EstadoSesion.activa
    ).first()
    
    if lider_existente:
        raise HTTPException(status_code=400, detail="La mesa ya tiene un líder asignado.")
    
    item.is_lider = True
    db.commit()
    db.refresh(item)
    return item
