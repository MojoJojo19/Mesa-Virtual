from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from App.Core.config import DATABASE_URL

# Crear el motor de conexión
engine = create_engine(DATABASE_URL, echo=True)

# Crear la fábrica de sesiones
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para nuestros modelos
Base = declarative_base()

# Función para obtener la BD en nuestros endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
