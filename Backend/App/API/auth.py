from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from App.DataBase.connection import get_db
from App.Models.usuario import Usuario
from App.Core.security import verificar_contrasena, crear_token_acceso, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Buscamos al usuario por correo (username en el formulario)
    usuario = db.query(Usuario).filter(Usuario.correo == form_data.username).first()
    
    if not usuario or not verificar_contrasena(form_data.password, usuario.contrasena):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Si todo está bien, creamos el token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = crear_token_acceso(
        data={"sub": usuario.correo, "rol": usuario.rol.value, "id_restaurante": usuario.id_restaurante}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "rol": usuario.rol,
        "id_usuario": usuario.id_usuario,
        "id_restaurante": usuario.id_restaurante,
        "nombre_restaurante": usuario.restaurante.nombre if usuario.restaurante else "SwiftTable"
    }
