"""
Genera los códigos QR de las mesas que no lo tengan.

Por qué hace falta: el poblado de `supabase_schema.sql` inserta las mesas con
`id_restaurante, numero, estado, pin`, pero sin `codigo_qr` — el QR es un PNG
que hay que generar, no un dato que se pueda escribir en el SQL. Por eso las
mesas del poblado aparecían en el panel de administración con "Sin QR generado";
solo las creadas desde el panel pasaban por `generar_qr_mesa`.

También sirve cuando cambia `FRONTEND_URL`: la URL va codificada DENTRO de la
imagen, así que al desplegar hay que regenerar los QR o los impresos seguirán
apuntando a localhost. Para eso está `--regenerar`.

Uso (con el venv activado, desde la carpeta Backend/ — la ruta de salida es
relativa a ahí):

    python generar_qr_mesas.py              # solo las que faltan
    python generar_qr_mesas.py --regenerar  # todas, tras cambiar FRONTEND_URL

Es idempotente: sin --regenerar, correrlo dos veces no cambia nada la segunda.
"""
import argparse
import os

from App.DataBase.connection import SessionLocal
from App.Models.mesa import Mesa
from App.Core.config import FRONTEND_URL
from App.Utils.qr_generator import generar_qr_mesa, QR_DIRECTORY
from App.Utils.pin_generator import generar_pin


def _falta_imagen(mesa):
    """
    El PNG puede haberse borrado aunque la columna tenga la ruta guardada
    (pasa al clonar el repo: App/Static/ no se versiona).
    """
    if not mesa.codigo_qr:
        return True
    nombre = os.path.basename(mesa.codigo_qr)
    return not os.path.isfile(os.path.join(QR_DIRECTORY, nombre))


def main():
    parser = argparse.ArgumentParser(description="Genera los QR de las mesas que no lo tengan.")
    parser.add_argument(
        "--regenerar",
        action="store_true",
        help="Regenera TODOS los QR, no solo los que faltan. Necesario si cambió FRONTEND_URL.",
    )
    args = parser.parse_args()

    print("Los QR apuntarán a: %s/mesa/<id>" % FRONTEND_URL)
    if not args.regenerar:
        print("(usa --regenerar si acabas de cambiar FRONTEND_URL)")
    print("")

    db = SessionLocal()
    generadas = 0
    pines = 0
    try:
        mesas = db.query(Mesa).order_by(Mesa.id_restaurante, Mesa.numero).all()
        if not mesas:
            print("No hay mesas en la base. ¿Falta aplicar supabase_schema.sql?")
            return

        for mesa in mesas:
            # El poblado sí trae PIN, pero una mesa creada a mano podría no tenerlo
            # y sin PIN el comensal no puede entrar.
            if not mesa.pin:
                mesa.pin = generar_pin()
                pines += 1

            if args.regenerar or _falta_imagen(mesa):
                mesa.codigo_qr = generar_qr_mesa(mesa.id_mesa)
                generadas += 1
                print("  QR  mesa %-3s (restaurante %s) -> %s"
                      % (mesa.numero, mesa.id_restaurante, mesa.codigo_qr))
            else:
                print("  --  mesa %-3s ya tenía QR" % mesa.numero)

        db.commit()
        print("\n%d QR generado(s) de %d mesa(s)." % (generadas, len(mesas)))
        if pines:
            print("%d PIN(es) creado(s) para mesas que no tenían." % pines)
    except Exception as e:
        db.rollback()
        print("Error: %s" % e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
