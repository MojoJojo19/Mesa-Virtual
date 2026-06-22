import os
from App.DataBase.connection import SessionLocal, Base, engine
from App.Models.mesa import Mesa
from App.Models.restaurante import Restaurante

print("Testing SQLite connection and tables...")
try:
    db = SessionLocal()
    # Check restaurantes
    rest = db.query(Restaurante).all()
    print("Restaurantes in SQLite:")
    for r in rest:
         print(f"- ID: {r.id_restaurante}, Nombre: {r.nombre}, RUC: {r.ruc}")
         
    # Check mesas
    mesas = db.query(Mesa).all()
    print("Mesas in SQLite:")
    for m in mesas:
         print(f"- ID: {m.id_mesa}, Numero: {m.numero}, Estado: {m.estado}, PIN: {m.pin}")
         
    db.close()
except Exception as e:
    print("SQLite test failed:")
    print(e)
