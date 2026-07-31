import os
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

# Tu URL de conexión a PostgreSQL
# ADVERTENCIA: esta credencial está versionada en git y hay que ROTARLA en
# Supabase. Moverla a un .env no basta: el valor viejo sigue en el historial.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:Gammasan170204*@db.jrgsoswdicpbrdnwyqem.supabase.co:5432/postgres"
)

# A dónde apuntan los QR de las mesas. En desarrollo es el Vite local, pero al
# desplegar hay que ponerlo en el .env: un QR impreso apuntando a localhost no
# le sirve a nadie que lo escanee con su celular.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
