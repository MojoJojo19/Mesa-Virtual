from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.categoria import Categoria
from App.Schemas.categoria import CategoriaCreate, CategoriaResponse

router = APIRouter(prefix="/api/categorias", tags=["Categorias"])

@router.post("/", response_model=CategoriaResponse)
def crear_categoria(datos: CategoriaCreate, id_restaurante: int, db: Session = Depends(get_db)):
    nuevo = Categoria(**datos.model_dump(), id_restaurante=id_restaurante)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=List[CategoriaResponse])
def listar_categorias(id_restaurante: int = None, db: Session = Depends(get_db)):
    query = db.query(Categoria)
    if id_restaurante is not None:
        query = query.filter(Categoria.id_restaurante == id_restaurante)
    return query.all()

@router.get("/{id}", response_model=CategoriaResponse)
def obtener_categoria(id: int, db: Session = Depends(get_db)):
    item = db.query(Categoria).filter(Categoria.id_categoria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    return item

@router.delete("/{id}")
def eliminar_categoria(id: int, db: Session = Depends(get_db)):
    item = db.query(Categoria).filter(Categoria.id_categoria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(item)
    db.commit()
    return {"mensaje": "Eliminado correctamente"}
