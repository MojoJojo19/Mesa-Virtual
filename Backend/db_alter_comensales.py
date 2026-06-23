import os
import sys

# Añadir el directorio raíz al path para poder importar App
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from App.DataBase.connection import engine

def main():
    try:
        with engine.begin() as conn:
            # Ejecutar el ALTER TABLE para añadir la columna
            # Se usa text() para consultas SQL directas en SQLAlchemy
            conn.execute(text("ALTER TABLE comensales ADD COLUMN IF NOT EXISTS is_lider BOOLEAN DEFAULT FALSE;"))
            
        print("Script ejecutado con éxito: Columna is_lider añadida a la tabla comensales.")
    except Exception as e:
        print(f"Error al ejecutar el script: {e}")

if __name__ == "__main__":
    main()
