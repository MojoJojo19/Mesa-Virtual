from sqlalchemy import text
from App.DataBase.connection import engine

with engine.connect() as conn:
    print("Borrando todas las tablas...")
    conn.execute(text("DROP SCHEMA public CASCADE;"))
    conn.execute(text("CREATE SCHEMA public;"))
    conn.commit()
    print("¡Base de datos limpia y lista para Alembic!")
