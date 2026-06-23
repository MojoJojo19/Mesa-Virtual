import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from App.DataBase.connection import engine
from sqlalchemy import text

def run():
    print("Conectando a la BD para alterar la tabla 'mesas'...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE mesas ADD COLUMN tiempo_espera_adicional INTEGER DEFAULT 0"))
            conn.commit()
            print("Columna 'tiempo_espera_adicional' agregada exitosamente.")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("La columna ya existe. Todo bien.")
            else:
                print(f"Error al agregar columna (puede que ya exista o la DB no soporte el alter simple): {e}")

if __name__ == "__main__":
    run()
