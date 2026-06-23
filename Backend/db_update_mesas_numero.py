import os
import sys

# Añadir el directorio raíz al path para poder importar App
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from App.DataBase.connection import engine

def main():
    try:
        with engine.connect() as conn:
            # Actualizar el numero restando 1000 a los que tengan 1000 o más
            # (1001 pasará a 1, 1002 pasará a 2)
            conn.execute(text("UPDATE mesas SET numero = numero - 1000 WHERE numero > 1000"))
            conn.commit()
            print("Números de mesas actualizados correctamente.")
    except Exception as e:
        print(f"Error al actualizar las mesas: {e}")

if __name__ == "__main__":
    main()
