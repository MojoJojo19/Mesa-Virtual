"""
Deja las contraseñas del personal en bcrypt para que el login funcione.

Por qué hace falta: el poblado de `supabase_schema.sql` insertó las contraseñas
en texto plano ('fisi2025', 'italia2025'), pero `App/API/auth.py` las verifica
con bcrypt. passlib no reconoce un texto plano como hash, así que
`POST /api/auth/login` nunca pudo autenticar a nadie — de ahí que el frontend
se quedara con un PIN cableado.

Este script recorre los usuarios y, al que tenga la contraseña sin hashear, se
la rehashea conservando el mismo valor. Si no existe el admin de un restaurante,
lo crea. Es idempotente: correrlo dos veces no cambia nada la segunda vez.

Uso (con el venv activado, desde la carpeta Backend/):

    python crear_staff.py

Después puedes entrar al panel con los correos y contraseñas que imprime.
"""
from App.DataBase.connection import SessionLocal
from App.Models.usuario import Usuario
from App.Models.restaurante import Restaurante
from App.Core.security import obtener_hash_contrasena

# Cuentas de demostración, una por restaurante del poblado inicial.
CUENTAS = [
    {"id_restaurante": 1, "nombre": "Administrador Fogata", "correo": "admin@lafogata.com",     "contrasena": "fisi2025",   "rol": "admin"},
    {"id_restaurante": 2, "nombre": "Administrador Italia", "correo": "admin@pizzaitalia.com", "contrasena": "italia2025", "rol": "admin"},
]


def _esta_hasheada(valor):
    """Los hashes de bcrypt siempre empiezan con $2a$, $2b$ o $2y$."""
    return isinstance(valor, str) and valor.startswith("$2")


def main():
    db = SessionLocal()
    try:
        for cuenta in CUENTAS:
            restaurante = db.query(Restaurante).filter(
                Restaurante.id_restaurante == cuenta["id_restaurante"]
            ).first()
            if not restaurante:
                print("Restaurante %s no existe todavía, se omite %s"
                      % (cuenta["id_restaurante"], cuenta["correo"]))
                continue

            usuario = db.query(Usuario).filter(Usuario.correo == cuenta["correo"]).first()

            if not usuario:
                usuario = Usuario(
                    id_restaurante=cuenta["id_restaurante"],
                    nombre=cuenta["nombre"],
                    correo=cuenta["correo"],
                    contrasena=obtener_hash_contrasena(cuenta["contrasena"]),
                    rol=cuenta["rol"],
                )
                db.add(usuario)
                print("Creado   %s (contraseña: %s)" % (cuenta["correo"], cuenta["contrasena"]))
            elif not _esta_hasheada(usuario.contrasena):
                # Conservamos la contraseña que ya estaba, solo la hasheamos.
                plana = usuario.contrasena or cuenta["contrasena"]
                usuario.contrasena = obtener_hash_contrasena(plana)
                print("Hasheado %s (contraseña: %s)" % (cuenta["correo"], plana))
            else:
                print("Sin cambios %s (ya estaba hasheada)" % cuenta["correo"])

        # Cualquier otro usuario que haya quedado en texto plano.
        for usuario in db.query(Usuario).all():
            if not _esta_hasheada(usuario.contrasena):
                usuario.contrasena = obtener_hash_contrasena(usuario.contrasena)
                print("Hasheado %s (contraseña conservada)" % usuario.correo)

        db.commit()
        print("\nListo. Ya puedes entrar al panel con esas credenciales.")
    except Exception as e:
        db.rollback()
        print("Error: %s" % e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
