from pydantic import BaseModel, EmailStr

class UsuarioCreate(BaseModel):
    nombre: str
    correo: EmailStr
    contrasena: str
    rol: str
    # La columna es NOT NULL en la base: sin esto, crear un usuario por API
    # siempre reventaba contra la restricción.
    id_restaurante: int

class UsuarioResponse(BaseModel):
    id_usuario: int
    id_restaurante: int
    nombre: str
    correo: EmailStr
    rol: str
    estado: str

    class Config:
        from_attributes = True
