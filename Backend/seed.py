from App.DataBase.connection import SessionLocal, Base, engine
from App.Models.mesa import Mesa
from App.Models.categoria import Categoria
from App.Models.producto import Producto

def seed_db():
    print("Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. Crear Mesa 7 si no existe
        mesa7 = db.query(Mesa).filter(Mesa.numero == 7).first()
        if not mesa7:
            print("Creando Mesa 7...")
            mesa7 = Mesa(numero=7)
            db.add(mesa7)
            db.commit()
            db.refresh(mesa7)
            # Podríamos llamar al generador de QR aquí, pero por ahora solo creamos la mesa
        else:
            print("Mesa 7 ya existe.")

        # 2. Crear Categorías
        cat_pollos = db.query(Categoria).filter(Categoria.nombre == "Pollos").first()
        if not cat_pollos:
            print("Creando categoría Pollos...")
            cat_pollos = Categoria(nombre="Pollos", descripcion="Pollo a la brasa")
            db.add(cat_pollos)
            db.commit()
            db.refresh(cat_pollos)

        cat_bebidas = db.query(Categoria).filter(Categoria.nombre == "Bebidas").first()
        if not cat_bebidas:
            print("Creando categoría Bebidas...")
            cat_bebidas = Categoria(nombre="Bebidas", descripcion="Gaseosas y refrescos")
            db.add(cat_bebidas)
            db.commit()
            db.refresh(cat_bebidas)

        # 3. Crear Productos
        productos_data = [
            {"nombre": "Pollo a la brasa 1/4", "descripcion": "Con papas fritas y ensalada", "precio": 18.00, "id_categoria": cat_pollos.id_categoria, "estado": "disponible"},
            {"nombre": "Pollo a la brasa 1/2", "descripcion": "Con papas fritas y ensalada", "precio": 32.00, "id_categoria": cat_pollos.id_categoria, "estado": "disponible"},
            {"nombre": "Combo familiar", "descripcion": "Pollo entero + 4 bebidas + papas", "precio": 75.00, "id_categoria": cat_pollos.id_categoria, "estado": "disponible"},
            {"nombre": "Inca Kola 500ml", "descripcion": "Gaseosa personal", "precio": 5.00, "id_categoria": cat_bebidas.id_categoria, "estado": "disponible"}
        ]

        for p_data in productos_data:
            prod = db.query(Producto).filter(Producto.nombre == p_data["nombre"]).first()
            if not prod:
                print(f"Creando producto: {p_data['nombre']}")
                nuevo_prod = Producto(**p_data)
                db.add(nuevo_prod)
            else:
                print(f"Producto {p_data['nombre']} ya existe.")
        
        db.commit()
        print("¡Base de datos poblada exitosamente!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
