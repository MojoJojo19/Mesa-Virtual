from pydantic import BaseModel

class MesaCreate(BaseModel):
    numero: int

class MesaResponse(BaseModel):
    id_mesa: int
    numero: int
    estado: str
    codigo_qr: str | None = None
    # OJO: el pin NO se incluye aquí a propósito. Este schema lo usan los
    # endpoints públicos (listar/obtener mesa), y no queremos que cualquiera
    # que llame al endpoint pueda leer el pin sin haberlo ingresado.

    class Config:
        from_attributes = True

class MesaCreateResponse(MesaResponse):
    # Este sí incluye el pin: solo se devuelve una vez, justo al crear la
    # mesa, para que el mesero/admin lo anote o lo imprima junto al QR.
    pin: str | None = None

class ValidarPinRequest(BaseModel):
    pin: str

class ValidarPinResponse(BaseModel):
    valido: bool

class MesaEstadoUpdate(BaseModel):
    estado: str
