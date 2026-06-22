import sys
import uuid
from sqlalchemy import text
from App.DataBase.connection import engine

def update_db():
    print("Iniciando actualización de la base de datos...")
    with engine.connect() as conn:
        # 1. Intentar agregar la columna token_sesion en PostgreSQL (si no existe)
        print("Intentando agregar columna token_sesion a la tabla 'mesas'...")
        try:
            # En PostgreSQL:
            conn.execute(text("ALTER TABLE mesas ADD COLUMN IF NOT EXISTS token_sesion VARCHAR(36) UNIQUE;"))
            conn.commit()
            print("Columna 'token_sesion' añadida exitosamente en PostgreSQL (si no existía).")
        except Exception as e:
            # En caso de error, intentar alternativo para SQLite
            print(f"PostgreSQL ALTER falló o es SQLite. Error: {e}")
            try:
                conn.execute(text("ALTER TABLE mesas ADD COLUMN token_sesion VARCHAR(36) UNIQUE;"))
                conn.commit()
                print("Columna 'token_sesion' añadida en SQLite.")
            except Exception as ex:
                print("Nota: Posiblemente la columna ya existe o ocurrió un error:", ex)

        # 2. Rellenar tokens vacíos para las mesas existentes
        try:
            result = conn.execute(text("SELECT id_mesa FROM mesas WHERE token_sesion IS NULL")).all()
            if result:
                print(f"Encontradas {len(result)} mesas sin token de sesión. Generando tokens...")
                for row in result:
                    id_mesa = row[0]
                    # Generamos un token corto y limpio de 8 caracteres
                    token = uuid.uuid4().hex[:8]
                    conn.execute(
                        text("UPDATE mesas SET token_sesion = :token WHERE id_mesa = :id_mesa"),
                        {"token": token, "id_mesa": id_mesa}
                    )
                conn.commit()
                print("Se poblaron todos los tokens de sesión vacíos.")
            else:
                print("No hay mesas con tokens de sesión vacíos.")
        except Exception as e:
            print("Error al poblar tokens vacíos:", e)

    print("Actualización de base de datos finalizada.")

if __name__ == "__main__":
    update_db()
