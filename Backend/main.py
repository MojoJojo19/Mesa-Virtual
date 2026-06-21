from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from App.DataBase.connection import engine, Base
import App.Models
import os

# Importar routers
from App.API.usuarios import router as usuarios_router
from App.API.categorias import router as categorias_router
from App.API.mesas import router as mesas_router
from App.API.productos import router as productos_router
from App.API.comensales import router as comensales_router
from App.API.asistencias import router as asistencias_router
from App.API.pedidos import router as pedidos_router
from App.API.detalles_pedido import router as detalles_pedido_router
from App.API.pagos import router as pagos_router
from App.API.auth import router as auth_router

# Ya NO creamos las tablas aquí. Ahora el esquema lo gobierna Alembic:
#   alembic upgrade head
# se corre antes de levantar el servidor (ver README / instrucciones del equipo).
# Dejar Base.metadata.create_all() activo junto con Alembic genera confusión:
# create_all() no sabe de migraciones, solo crea tablas que no existen,
# así que un cambio de columna nunca se aplicaría por esta vía.

app = FastAPI(title="SwiftTable API")

# Hacer pública la carpeta Static para ver los QRs desde el navegador
os.makedirs("App/Static/QRs", exist_ok=True)
app.mount("/static", StaticFiles(directory="App/Static"), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(usuarios_router)
app.include_router(categorias_router)
app.include_router(mesas_router)
app.include_router(productos_router)
app.include_router(comensales_router)
app.include_router(asistencias_router)
app.include_router(pedidos_router)
app.include_router(detalles_pedido_router)
app.include_router(pagos_router)
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de SwiftTable"}
