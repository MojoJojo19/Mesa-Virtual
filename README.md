# SwiftTable - Mesa Virtual

**SwiftTable** es una plataforma digital de "Mesa Virtual" diseñada para mejorar y agilizar la experiencia de los comensales en restaurantes. Permite a los clientes escanear un código QR en su mesa física, ingresar de forma segura a una sesión grupal mediante un PIN, elegir su método de pago preferido, realizar pedidos individuales y grupales de forma interactiva, y llamar al mesero directamente desde su smartphone.

El proyecto está diseñado de forma inteligente: si el backend no está disponible, el frontend cuenta con un mecanismo de **fallback con datos simulados (mock data)**, lo que permite que el flujo de usuario sea completamente navegable e interactivo de forma autónoma.

---

## Arquitectura y Tecnologías

El proyecto se divide en dos componentes principales:

### 1. Frontend (Cliente)
* **Tecnología Principal:** React 19 (SPA) con Vite.
* **Estilado:** CSS vanilla optimizado y responsive.
* **Ruteo:** React Router DOM v7 para la navegación fluida entre vistas.
* **Componentes Clave:**
  * **Bienvenida (`/mesa/:id`)**: Pantalla inicial al escanear el QR.
  * **PinIngreso (`/pin`)**: Validación de seguridad para unirse a la mesa.
  * **Ingreso (`/ingreso`)**: Personalización del comensal (nombre y selección de avatar).
  * **Lobby (`/lobby`)**: Sala común en tiempo real donde se ven los otros comensales de la mesa.
  * **Modo de Pago (`/pago-modo`)**: Selección de pago (individual, cuenta dividida, o un solo pagador).
  * **Menú (`/menu`)**: Navegación por categorías de productos (Entradas, Pollos, Bebidas, Postres), gestión de carrito y llamada al mesero.
  * **Pedido Grupal (`/pedido-grupo`)**: Vista consolidada de lo que ordenan todos en la mesa antes de confirmar.
  * **Resumen (`/resumen`)**: Consolidado final del pedido realizado.

### 2. Backend (Servidor)
* **Tecnología Principal:** Python 3 + FastAPI.
* **Base de Datos:** PostgreSQL (con ORM SQLAlchemy).
* **Seguridad y Autenticación:** Cifrado de contraseñas con `bcrypt` (`passlib`) y generación de tokens JWT (`python-jose`).
* **Generación de QR:** Creación automática de códigos QR dinámicos para las mesas usando `qrcode` y `Pillow`.

---

## Estructura del Proyecto

```text
Mesa-Virtual-master/
├── Frontend/                 # Aplicación de React + Vite
│   ├── public/               # Recursos públicos (iconos, favicon, redirecciones)
│   │   └── _redirects        # Regla de Netlify para SPA routing
│   ├── src/
│   │   ├── components/       # Componentes reutilizables (Toast, StepBar, etc.)
│   │   ├── pages/            # Vistas principales de la aplicación
│   │   ├── services/         # api.js para llamadas HTTP a FastAPI
│   │   ├── App.jsx           # Ruteador y contenedor principal
│   │   └── main.jsx          # Punto de entrada de React
│   ├── package.json
│   └── vite.config.js
│
├── Backend/                  # API en FastAPI
│   ├── App/
│   │   ├── API/              # Endpoints (mesas, pedidos, comensales, auth, etc.)
│   │   ├── Core/             # Configuración general y seguridad (JWT)
│   │   ├── DataBase/         # Conexión SQLAlchemy (connection.py)
│   │   ├── Models/           # Modelos de base de datos relacionales
│   │   ├── Schemas/          # Validaciones Pydantic
│   │   ├── Static/QRs/       # Almacenamiento local de QRs autogenerados
│   │   └── Utils/            # Utilidades como generador de QR
│   ├── requirements.txt      # Dependencias del servidor Python
│   ├── main.py               # Punto de entrada de FastAPI
│   └── seed.py               # Script para poblar la base de datos con datos de prueba
```

---

## Guía de Ejecución en Local

### 1. Levantar el Backend (FastAPI)
1. **Instalar Python 3** (si aún no lo tienes).
2. Abre la terminal en el directorio `Backend/` y crea un entorno virtual:
   ```bash
   python -m venv venv
   ```
3. Activa el entorno virtual:
   * **En Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **En macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```
4. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
5. **Base de Datos (PostgreSQL):**
   * Por defecto busca una base de datos local en `postgresql://postgres:fisi2025@localhost:5432/swifttable`.
   * Si tus credenciales son distintas, puedes configurar la variable de entorno `DATABASE_URL` o modificarla en [config.py](file:///c:/Users/RODRIGO/Desktop/Mesa-Virtual-master%20%281%29/Mesa-Virtual-master/Backend/App/Core/config.py).
6. Poblado inicial de datos (Crea la Mesa 7, productos y categorías por defecto):
   ```bash
   python seed.py
   ```
7. Inicia el servidor de desarrollo:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   * *La API estará disponible en:* `http://127.0.0.1:8000`
   * *Documentación interactiva Swagger:* `http://127.0.0.1:8000/docs`

---

### 2. Levantar el Frontend (React + Vite)
1. Abre la terminal en el directorio `Frontend/`.
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Ejecuta la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```
   * *El cliente estará disponible en:* `http://localhost:5173` (o la dirección que indique la consola).
   * Por defecto, la app te redirigirá a `/mesa/7` para interactuar con la Mesa 7 de prueba.

---

## ¿Cómo desplegar en Netlify y la Nube de forma segura?

**¿Se puede subir todo a Netlify?**
* **Frontend (Sí):** Netlify es un servicio especializado en alojar páginas estáticas y aplicaciones de una sola página (SPA) como la de React/Vite.
* **Backend (No directamente):** Netlify no soporta la ejecución de servicios persistentes de Python/FastAPI con base de datos PostgreSQL.
* **Solución Profesional:** Se realiza un despliegue desacoplado. El frontend va a **Netlify** y el backend + base de datos se despliegan en plataformas que soporten contenedores o servicios web como **Render**, **Railway**, o **Fly.io**.

### Paso 1: Desplegar la Base de Datos y el Backend
Puedes usar **Render** (gratuito/bajo costo) o **Railway**:
1. **Crear base de datos PostgreSQL:** En Render o Railway, crea una base de datos PostgreSQL vacía. Copia la URL de conexión (ej. `postgresql://...`).
2. **Desplegar FastAPI:**
   * Crea un "Web Service" conectado a tu repositorio de GitHub.
   * Selecciona el subdirectorio `Backend` como raíz del servicio (o deja la raíz del repositorio y configura el comando de inicio apuntando allí).
   * **Comando de construcción (Build Command):** `pip install -r requirements.txt`
   * **Comando de inicio (Start Command):** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   * **Variables de Entorno (Environment Variables):**
     * Añade la variable `DATABASE_URL` con el link de la base de datos PostgreSQL que creaste en el paso anterior.
3. Al terminar el despliegue, obtendrás una URL pública de tu API (ej. `https://mi-backend-api.onrender.com`).

---

### Paso 2: Desplegar el Frontend en Netlify
1. **Crear una cuenta en Netlify** y conectar tu repositorio de GitHub.
2. Configura los parámetros de despliegue:
   * **Base directory:** `Frontend`
   * **Build command:** `npm run build`
   * **Publish directory:** `Frontend/dist` (o `dist` si el directorio base ya está en `Frontend`)
3. **Configurar Variables de Entorno en Netlify:**
   * Ve a *Site configuration* > *Environment variables*.
   * Crea una variable llamada: `VITE_API_URL`
   * Su valor debe ser la URL pública del backend creada en el Paso 1 añadiendo `/api` (ej. `https://mi-backend-api.onrender.com/api`).
4. **Soporte de Rutas (React Router):**
   * Ya hemos configurado por ti el archivo [_redirects](file:///c:/Users/RODRIGO/Desktop/Mesa-Virtual-master%20%281%29/Mesa-Virtual-master/Frontend/public/_redirects) en la carpeta pública. Este archivo le dice a Netlify que redirija cualquier solicitud URL al `index.html` para que React Router haga su trabajo y evite devolver errores 404 al recargar la página.
5. Haz clic en **Deploy site**. ¡Tu aplicación frontend estará lista y conectada de forma segura al backend en la nube!
