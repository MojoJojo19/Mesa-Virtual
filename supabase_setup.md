# Guía de Conexión y Configuración de PostgreSQL en Supabase

Esta guía explica detalladamente cómo configurar tu base de datos de **Supabase** en la nube y conectar el Backend del sistema de Mesa Virtual **La Fogata**.

---

## Paso 1: Crear el Proyecto en Supabase

1. Ve a [Supabase.com](https://supabase.com/) e inicia sesión (puedes registrarte gratis usando tu cuenta de GitHub).
2. Haz clic en **New Project** y selecciona tu organización.
3. Configura los datos de tu nuevo proyecto:
   * **Name**: `MesaVirtual`
   * **Database Password**: Define una contraseña segura (e.g., `Gammasan170204*`). *Guarda bien esta contraseña.*
   * **Region**: Selecciona la región de servidores más cercana a ti para reducir la latencia (por ejemplo, `South America (São Paulo)`).
   * **Pricing Plan**: Selecciona el plan **Free** (Gratuito).
4. Haz clic en **Create new project** y espera aproximadamente 1-2 minutos a que el servidor termine de aprovisionarse.

---

## Paso 2: Crear las Tablas y Sembrar Datos en la Nube

Una vez creado el proyecto en Supabase, sigue estos pasos para inicializar el esquema de tablas:

1. En el panel izquierdo de Supabase, entra al menú **SQL Editor** (representado por el ícono `SQL`).
2. Haz clic en **New Query**.
3. Abre el archivo [supabase_schema.sql](file:///c:/Users/USUARIO/Desktop/Mesa-Virtual/supabase_schema.sql) que hemos creado en la raíz de tu proyecto, copia todo su contenido y pégalo en el editor de consultas SQL de Supabase.
4. Haz clic en el botón **Run** (Ejecutar) en la esquina superior derecha.
5. Deberías ver un mensaje indicando que la consulta se ejecutó con éxito (`Success. No rows returned` y las tablas pobladas). 
6. Puedes verificar que todo esté en orden entrando al menú **Table Editor** en el panel izquierdo; verás las 9 tablas (`mesas`, `pedidos`, `productos`, etc.) llenas con los datos iniciales listos para operar.

---

## Paso 3: Obtener la URL de Conexión de Supabase

1. En el panel izquierdo de Supabase, haz clic en el ícono de engranaje **Project Settings** (Configuración del Proyecto) -> **Database**.
2. Desplázate hacia abajo hasta la sección **Connection string**.
3. Asegúrate de seleccionar la pestaña **URI** (es la más compatible con SQLAlchemy en Python).
4. Copia la cadena de conexión provista, la cual se verá similar a la siguiente:
   ```text
   postgresql://postgres.[tu_project_id]:[tu_password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
5. **IMPORTANTE**: Reemplaza el marcador `[tu_password]` por la contraseña real que definiste al crear el proyecto en el Paso 1.

---

## Paso 4: Configurar la Variable de Entorno en el Backend

El backend en Python lee la base de datos a través de la variable de entorno `DATABASE_URL` (según se define en [config.py](file:///c:/Users/USUARIO/Desktop/Mesa-Virtual/Backend/App/Core/config.py)).

1. Ve a la carpeta del backend: `Backend/`.
2. Crea un archivo de configuración llamado `.env` si no existe.
3. Añade la variable `DATABASE_URL` configurando la URI de conexión que copiaste en el paso anterior:
   ```env
   DATABASE_URL=postgresql://postgres:Gammasan170204*@db.jrgsoswdicpbrdnwyqem.supabase.co:5432/postgres
   ```
   *(Asegúrate de agregar `?sslmode=require` al final si utilizas conexión encriptada SSL obligatoria de Supabase).*

---

## Paso 5: Levantar el Servidor del Backend

1. Abre tu terminal en la carpeta `Backend/`.
2. Activa tu entorno virtual Python:
   ```powershell
   .venv\Scripts\activate
   ```
3. Instala las dependencias necesarias en caso de que falten:
   ```bash
   pip install -r requirements.txt
   ```
4. Levanta el servidor FastAPI:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
5. El servidor estará corriendo localmente en el puerto `8000`, pero escribirá y leerá directamente desde la base de datos de PostgreSQL en la nube de Supabase.

---

## Paso 6: Conectar el Frontend a la Base de Datos Real

Actualmente, el Frontend está configurado para simular las llamadas en memoria local a través de `localStorage` para garantizar la funcionalidad offline. Si deseas que tu Frontend se comunique con tu base de datos de Supabase a través del backend:

1. Levanta el backend en el puerto `8000` (el backend se encargará de interactuar con Supabase).
2. El Frontend se comunica automáticamente con la dirección del backend real.
3. Si deseas probar el flujo completo con datos reales, limpia el almacenamiento local de tu navegador para remover los mocks del localStorage (`F12` -> Application -> Local Storage -> Clear).
4. La aplicación web se conectará con los endpoints del backend que ahora consumen la nube de Supabase.
