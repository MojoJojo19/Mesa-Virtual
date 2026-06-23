from sqlalchemy import text
from App.DataBase.connection import engine

new_categories = [
    # (id_restaurante, nombre, descripcion)
    (1, 'Entradas y Guarniciones', 'Acompañamientos y entradas criollas'),
    (1, 'Postres', 'Postres peruanos tradicionales'),
    (2, 'Entradas', 'Entradas italianas tradicionales'),
    (2, 'Postres', 'Postres italianos artesanales')
]

new_products = [
    # (id_restaurante, nombre, descripcion, precio, categoria_nombre, estado)
    # La Fogata (1) - Pollos (1)
    (1, 'Pollo a la brasa 1 entero', 'Pollo entero marinado con papas fritas y ensalada familiar', 62.00, 'Pollos', 'disponible'),
    (1, 'Pechuga a la parrilla', 'Filete de pechuga tierna a la parrilla con papas fritas', 24.00, 'Pollos', 'disponible'),
    
    # La Fogata (1) - Bebidas (2)
    (1, 'Chicha Morada 1L', 'Bebida de maíz morado, piña, manzana y canela helada', 12.00, 'Bebidas', 'disponible'),
    (1, 'Inca Kola 1.5L', 'Gaseosa tamaño familiar helada', 9.50, 'Bebidas', 'disponible'),
    
    # La Fogata (1) - Entradas y Guarniciones
    (1, 'Anticuchos', 'Dos palitos de corazón de res con papa dorada y choclo', 22.00, 'Entradas y Guarniciones', 'disponible'),
    (1, 'Porción de Tequeños', 'Tequeños rellenos de queso con salsa guacamole', 14.00, 'Entradas y Guarniciones', 'disponible'),
    (1, 'Porción de Papas Fritas Extra', 'Papas amarillas crocantes recién fritas', 8.50, 'Entradas y Guarniciones', 'disponible'),
    
    # La Fogata (1) - Postres
    (1, 'Suspiro a la Limeña', 'Dulce tradicional de yemas y leche evaporada con merengue', 10.00, 'Postres', 'disponible'),
    (1, 'Tres Leches de Lúcuma', 'Pastel húmedo sabor lúcuma bañado en tres leches', 12.00, 'Postres', 'disponible'),
    
    # Pizzería Italia (2) - Pizzas (3)
    (2, 'Pizza Cuatro Quesos', 'Mozzarella, gorgonzola, parmesano y fontina', 34.00, 'Pizzas', 'disponible'),
    (2, 'Pizza Hawaiana', 'Mozzarella, jamón inglés y piña en almíbar', 28.00, 'Pizzas', 'disponible'),
    (2, 'Pizza Vegetariana', 'Pimientos, champiñones, aceitunas verdes y cebolla blanca', 30.00, 'Pizzas', 'disponible'),
    
    # Pizzería Italia (2) - Bebidas (4)
    (2, 'Limonada Italiana', 'Limonada frozen con toque de menta y jengibre', 8.00, 'Bebidas', 'disponible'),
    (2, 'Botella de Vino Chianti', 'Vino tinto italiano tradicional de la casa', 48.00, 'Bebidas', 'disponible'),
    
    # Pizzería Italia (2) - Entradas
    (2, 'Focaccia con Romero', 'Pan plano italiano sazonado con aceite de oliva y romero', 12.00, 'Entradas', 'disponible'),
    (2, 'Bruschetta de Pomodoro', 'Pan tostado con tomate picado, albahaca y aceite de oliva', 10.00, 'Entradas', 'disponible'),
    
    # Pizzería Italia (2) - Postres
    (2, 'Tiramisú Tradicional', 'Bizcochos de café, licor de amaretto y crema de mascarpone', 16.00, 'Postres', 'disponible'),
    (2, 'Panna Cotta de Fresa', 'Flan de crema de leche con coulis de fresas frescas', 12.00, 'Postres', 'disponible')
]

with engine.connect() as conn:
    print("Iniciando inserción de nuevas categorías y platos...")
    
    # 1. Insertar categorías si no existen
    for id_rest, cat_nombre, cat_desc in new_categories:
        # Verificar si existe
        exists = conn.execute(
            text("SELECT id_categoria FROM categorias WHERE id_restaurante = :rest_id AND nombre = :name"),
            {"rest_id": id_rest, "name": cat_nombre}
        ).first()
        
        if not exists:
            print(f"Insertando categoría '{cat_nombre}' para el restaurante ID {id_rest}...")
            conn.execute(
                text("INSERT INTO categorias (id_restaurante, nombre, descripcion) VALUES (:rest_id, :name, :desc)"),
                {"rest_id": id_rest, "name": cat_nombre, "desc": cat_desc}
            )
        else:
            print(f"Categoría '{cat_nombre}' para el restaurante ID {id_rest} ya existe.")
            
    conn.commit()
    
    # Obtener mapeo actualizado de categorías (nombre, id_restaurante) -> id_categoria
    db_cats = conn.execute(text("SELECT id_categoria, id_restaurante, nombre FROM categorias")).all()
    cat_map = {(row[2], row[1]): row[0] for row in db_cats}
    
    # 2. Insertar productos si no existen
    for id_rest, prod_nombre, prod_desc, precio, cat_nombre, estado in new_products:
        cat_id = cat_map.get((cat_nombre, id_rest))
        if not cat_id:
            print(f"Error: No se encontró la categoría '{cat_nombre}' para el restaurante ID {id_rest}.")
            continue
            
        # Verificar si ya existe el producto con el mismo nombre y categoría
        exists = conn.execute(
            text("SELECT id_producto FROM productos WHERE id_categoria = :cat_id AND nombre = :name"),
            {"cat_id": cat_id, "name": prod_nombre}
        ).first()
        
        if not exists:
            print(f"Insertando producto '{prod_nombre}' (Precio: {precio}) para restaurante ID {id_rest}...")
            conn.execute(
                text("INSERT INTO productos (id_restaurante, nombre, descripcion, precio, id_categoria, estado) VALUES (:rest_id, :name, :desc, :precio, :cat_id, :estado)"),
                {"rest_id": id_rest, "name": prod_nombre, "desc": prod_desc, "precio": precio, "cat_id": cat_id, "estado": estado}
            )
        else:
            print(f"Producto '{prod_nombre}' en categoría ID {cat_id} ya existe.")
            
    conn.commit()
    print("¡Nuevas comidas y categorías registradas exitosamente en la base de datos de Supabase!")
