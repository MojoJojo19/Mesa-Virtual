import os
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

# Tu URL de conexión a PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:Gammasan170204*@db.jrgsoswdicpbrdnwyqem.supabase.co:5432/postgres"
)
