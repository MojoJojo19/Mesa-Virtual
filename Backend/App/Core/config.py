import os

# Tu URL de conexión a PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:fisi2025@localhost:5432/swifttable"
)
