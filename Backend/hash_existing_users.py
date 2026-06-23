import bcrypt
from sqlalchemy import text
from App.DataBase.connection import engine

with engine.connect() as conn:
    print("Checking usuarios table in Supabase...")
    result = conn.execute(text("SELECT id_usuario, correo, contrasena FROM usuarios")).all()
    updated = False
    for row in result:
        id_usuario, correo, contrasena = row
        # If it doesn't look like a bcrypt hash (standard length 60 and starts with $2b$ or $2a$)
        if not (contrasena.startswith("$2b$") or contrasena.startswith("$2a$")) or len(contrasena) != 60:
            hashed = bcrypt.hashpw(contrasena.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            print(f"Password for user '{correo}' is plaintext ('{contrasena}'). Hashing to '{hashed}'...")
            conn.execute(
                text("UPDATE usuarios SET contrasena = :hashed WHERE id_usuario = :id"),
                {"hashed": hashed, "id": id_usuario}
            )
            updated = True
        else:
            print(f"Password for user '{correo}' is already hashed.")
            
    if updated:
        conn.commit()
        print("Database updated successfully!")
    else:
        print("No plaintext passwords found. Everything is already secure.")
