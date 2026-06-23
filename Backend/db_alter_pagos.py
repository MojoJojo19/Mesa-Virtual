import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from App.DataBase.connection import engine
from sqlalchemy import text

def add_id_usuario_to_pagos():
    try:
        with engine.connect() as conn:
            # Check if column exists first
            check_sql = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='pagos' and column_name='id_usuario';
            """)
            result = conn.execute(check_sql).fetchone()
            
            if result:
                print("La columna id_usuario ya existe en la tabla pagos.")
            else:
                alter_sql = text("""
                    ALTER TABLE pagos 
                    ADD COLUMN id_usuario INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL;
                """)
                conn.execute(alter_sql)
                conn.commit()
                print("Columna id_usuario añadida exitosamente a la tabla pagos.")
    except Exception as e:
        print(f"Error alterando la tabla: {e}")

if __name__ == "__main__":
    add_id_usuario_to_pagos()
