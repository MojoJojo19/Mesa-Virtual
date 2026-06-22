import os
import tempfile
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from App.Core.config import DATABASE_URL

# Intentar conectar a la base de datos principal (PostgreSQL/Supabase)
try:
    engine = create_engine(DATABASE_URL, echo=True)
    # Forzar una conexión de prueba para validar credenciales y DNS
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("CONEXION EXITOSA: Conectado a la base de datos principal (PostgreSQL/Supabase).")
    use_sqlite = False
except Exception as e:
    print("AVISO: No se pudo conectar a la base de datos principal.")
    print(f"Error detallado: {e}")
    print("Activando FALLBACK: Usando base de datos local SQLite (swifttable.db).")
    
    # Crear ruta para SQLite en el directorio temporal para evitar Controlled Folder Access de Windows
    db_path = os.path.join(tempfile.gettempdir(), "swifttable.db")
    db_path_formatted = db_path.replace("\\", "/")
    DATABASE_URL_SQLITE = f"sqlite:///{db_path_formatted}"
    engine = create_engine(DATABASE_URL_SQLITE, connect_args={"check_same_thread": False}, echo=True)
    use_sqlite = True

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Si se usa SQLite, nos aseguramos de crear las tablas para que no falle al arrancar
if use_sqlite:
    db = None
    try:
        import App.Models
        Base.metadata.create_all(bind=engine)
        print("Tablas de SQLite creadas/verificadas exitosamente.")
        
        # Opcional: Sembrar datos iniciales en la base de datos SQLite si está vacía
        db = SessionLocal()
        from App.Models.mesa import Mesa
        if db.query(Mesa).count() == 0:
            print("Poblando base de datos SQLite con datos iniciales...")
            from App.Models.restaurante import Restaurante
            from App.Models.categoria import Categoria
            from App.Models.producto import Producto
            
            # Crear Restaurantes de prueba
            rest1 = Restaurante(nombre="La Fogata", ruc="20456789123", direccion="Av. Universitaria 1801, Lima", telefono="01-445566")
            rest2 = Restaurante(nombre="Pizzería Italia", ruc="20987654321", direccion="Calle Larco 550, Miraflores", telefono="01-778899")
            db.add_all([rest1, rest2])
            db.commit()
            db.refresh(rest1)
            db.refresh(rest2)
            
            # Crear mesas
            # Mesa 7 de prueba (para coincidir con el frontend)
            mesa7 = Mesa(id_restaurante=rest1.id_restaurante, numero=7, estado="libre", pin="7823")
            mesa1001 = Mesa(id_restaurante=rest1.id_restaurante, numero=1001, estado="libre", pin="1111")
            db.add_all([mesa7, mesa1001])
            
            # Crear categorías
            cat_pollos = Categoria(id_restaurante=rest1.id_restaurante, nombre="Pollos", descripcion="Pollo a la brasa")
            cat_bebidas = Categoria(id_restaurante=rest1.id_restaurante, nombre="Bebidas", descripcion="Gaseosas y refrescos")
            db.add_all([cat_pollos, cat_bebidas])
            db.commit()
            db.refresh(cat_pollos)
            db.refresh(cat_bebidas)
            
            # Crear productos
            p1 = Producto(id_restaurante=rest1.id_restaurante, nombre="Pollo a la brasa 1/4", descripcion="Con papas fritas and ensalada", precio=18.00, id_categoria=cat_pollos.id_categoria, estado="disponible")
            p2 = Producto(id_restaurante=rest1.id_restaurante, nombre="Pollo a la brasa 1/2", descripcion="Con papas fritas y ensalada", precio=32.00, id_categoria=cat_pollos.id_categoria, estado="disponible")
            p3 = Producto(id_restaurante=rest1.id_restaurante, nombre="Combo familiar", descripcion="Pollo entero + 4 bebidas + papas", precio=75.00, id_categoria=cat_pollos.id_categoria, estado="disponible")
            p4 = Producto(id_restaurante=rest1.id_restaurante, nombre="Inca Kola 500ml", descripcion="Gaseosa personal helada", precio=5.00, id_categoria=cat_bebidas.id_categoria, estado="disponible")
            db.add_all([p1, p2, p3, p4])
            db.commit()
            print("Datos de semilla SQLite insertados con éxito.")
    except Exception as e:
        print(f"Error al sembrar SQLite: {e}")
        if db is not None:
            db.rollback()
    finally:
        if db is not None:
            db.close()

# Función para obtener la BD en nuestros endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

