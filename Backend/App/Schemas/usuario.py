from pydantic import BaseModel, EmailStr

class UsuarioCreate(BaseModel):
    nombre: str
    correo: EmailStr
    contrasena: str
    rol: str

class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    correo: EmailStr
    rol: str
    estado: str

    class Config:
        from_attributes = True
