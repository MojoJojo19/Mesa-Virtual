import os
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

# Tu URL de conexión a PostgreSQL (se usa el pooler de Supabase compatible con IPv4)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.jrgsoswdicpbrdnwyqem:Gammasan170204*@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
)
