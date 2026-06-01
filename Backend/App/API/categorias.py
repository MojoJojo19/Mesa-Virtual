from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.categoria import Categoria
from App.Schemas.categoria import CategoriaCreate, CategoriaResponse

router = APIRouter(prefix="/api/categorias", tags=["Categorias"])

@router.post("/", response_model=CategoriaResponse)
def crear_categoria(datos: CategoriaCreate, db: Session = Depends(get_db)):
    nuevo = Categoria(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=list[CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db)):
    return db.query(Categoria).all()

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
