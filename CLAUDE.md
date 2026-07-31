# SwiftTable (Mesa-Virtual) — guía para Claude

Carta digital + panel de sala para restaurantes. El comensal escanea el QR de su mesa,
entra con un PIN, pide desde su celular y el personal ve todo en un panel único
(salón, cocina, caja). Multi-restaurante: todo cuelga de `id_restaurante`.

## Cómo levantarlo

```powershell
# Backend  (http://127.0.0.1:8000, docs en /docs)
cd Backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000

# Frontend (Vite, http://localhost:5173)
cd Frontend; npm run dev
```

⚠ **El esquema NO se aplica con Alembic.** Su única migración (`f1d4959577f8`)
quedó desactualizada: crea 9 tablas, sin `restaurantes` ni `id_restaurante`.
El esquema real es `supabase_schema.sql`, que se pega en el SQL Editor de Supabase.
Los cambios incrementales viven en `Backend/migraciones_sql/` (idempotentes).

`python crear_staff.py` deja las contraseñas del personal en bcrypt — sin eso el
login no funciona. `python seed.py` está roto: crea mesas/categorías/productos sin
`id_restaurante` (NOT NULL) y llama a `create_all()`, que main.py evita a propósito.

**No hay tests** en el proyecto.

## Stack

- **Backend**: FastAPI + SQLAlchemy 2.x + Alembic, PostgreSQL en Supabase.
  Pydantic v2 (`model_dump`), pero tipos escritos como `List[...]`/`Optional[...]`
  por compatibilidad con Python 3.8 — **no usar `list[str]` ni `str | None`**.
- **Frontend**: React 19 + Vite 8 + react-router-dom 7 + lucide-react. Sin librería de
  estado ni de UI: `useState` y `localStorage` a secas, CSS plano.

## Mapa de archivos

```
Backend/
  main.py                  monta los 10 routers + CORS abierto + /static para los QR
  App/API/*.py             un router por recurso, prefijo /api/<recurso>
  App/Models/*.py          SQLAlchemy; 10 tablas
  App/Schemas/*.py         Pydantic
  App/Core/config.py       DATABASE_URL ⚠ credencial en claro · FRONTEND_URL (destino de los QR)
  App/Core/security.py     bcrypt + JWT + obtener_usuario_actual (dependencia de auth)
  App/Utils/               qr_generator.py, pin_generator.py
  crear_staff.py           rehashea las contraseñas del personal a bcrypt
  migraciones_sql/         cambios de esquema incrementales, se pegan en Supabase
  alembic/versions/        ⚠ DESACTUALIZADO, no refleja el esquema real
Frontend/src/
  App.jsx                  todas las rutas
  services/api.js          ⭐ toda la comunicación HTTP + fallback mock
  theme/sala.js            colores de comensal, acento por restaurante, nombre del local
  index.css                1955 líneas; tokens `--st-*` y clases `.st-*` desde la línea ~735
  components/              TopBar, Monograma, StepBar, Toast (ToastProvider + useToast)
  pages/                   11 pantallas de comensal + Logistica (panel) + Administracion
```

## Modelo de pagos (importante)

`Pago.id_pedido` es **UNIQUE y NOT NULL**, así que por sí solo un pago no puede
cubrir la cuenta de una mesa con varios pedidos. Por eso `Pedido.id_pago` (FK
nullable): un pago cubre N pedidos, y `id_pedido` solo apunta al primero para
satisfacer la restricción. `Pago.items`, `Pago.id_mesa` y `Pago.subtotal` se
derivan de `pedidos_cubiertos`, con fallback a `pedido` para los pagos viejos.

`monto_total` = subtotal + 10% de servicio. **La propina va aparte**, no está
incluida en `monto_total`.

## Modelo de datos

`Restaurante` → mesas, categorías, productos, usuarios, comensales, pedidos, pagos, asistencias.
Todas las tablas hijas llevan `id_restaurante` con `ondelete=CASCADE`.

- `Mesa`: `numero`, `estado` (libre/ocupada/…), `codigo_qr`, `pin` (4 dígitos).
- `Comensal`: `nombre`, `avatar` (guarda un **hex** de la paleta, no un emoji), `estado_sesion`, `id_mesa`.
- `Pedido` → `DetallePedido` (cantidad, precio_unitario, subtotal) → `Producto`.
  Estados: pendiente → en_preparacion → servido → pagado / cancelado.
- `Pago`: 1-a-1 con `Pedido` (`id_pedido` es UNIQUE).

## Rutas del frontend

```
/                              SelectorRol   portada: elegir mesa (cliente) o PIN (personal)
/mesa/:idMesa                  Bienvenida
/mesa/:idMesa/pin              PinIngreso
/mesa/:idMesa/acceso           AccesoConfirmado
/mesa/:idMesa/ingreso          Ingreso       nombre + color del comensal
/mesa/:idMesa/lobby            Lobby         quién está en la mesa
/mesa/:idMesa/pago-modo        ModoPago      juntos / por separado
/mesa/:idMesa/menu             Menu          carta + carrito
/mesa/:idMesa/pedido-grupo     PedidoGrupal
/mesa/:idMesa/confirmado       PedidoEnviado
/mesa/:idMesa/resumen          Resumen
/logistica                     Logistica     panel de staff (salón / cocina / caja)
/admin                         Administracion mesas + QR, carta, personal
```

`/logistica` y `/admin` van envueltas en `<RutaStaff>` (App.jsx): sin sesión
redirigen a la portada.

## Endpoints (todos con prefijo `/api`)

🔒 = exige `Authorization: Bearer <token>`.

| Recurso | Rutas |
|---|---|
| `mesas` | 🔒`POST /` (crea + QR + PIN) · `GET /?id_restaurante=` · 🔒`GET /gestion` (con PIN y QR) · `GET /{id}` · `PUT /{id}/estado` · `POST /{id}/validar-pin` · `GET /{id}/comensales` · 🔒`POST /{id}/liberar` |
| `pedidos` | `POST /` (solo cabecera) · `GET /?id_restaurante=` · `GET /mesa/{id}` · 🔒`PUT /{id}/estado?nuevo_estado=` |
| `detalles_pedido` | `POST /` (una línea por producto) · `GET /` · `GET /pedido/{id}` |
| `pagos` | 🔒`POST /` · 🔒`POST /mesa/{id_mesa}` (cobra la mesa entera) · 🔒`GET /?id_restaurante=` |
| `asistencias` | `POST /` · `GET /?id_restaurante=` · `GET /mesa/{id}` · 🔒`PUT /{id}/atender` |
| `productos` | 🔒`POST /` · `GET /?id_restaurante=&incluir_inactivos=` · `GET /{id}` · 🔒`PUT /{id}` (parcial) · 🔒`DELETE /{id}` |
| `categorias` | 🔒`POST /` · `GET /?id_restaurante=` · `GET /{id}` · 🔒`DELETE /{id}` |
| `comensales` | `POST /` · `GET /` · `GET /{id}` · `PUT /{id}/cerrar-sesion` |
| `usuarios` | 🔒`POST /` · 🔒`GET /` · `GET /{id}` · 🔒`DELETE /{id}` (soft-delete) |
| `auth` | `POST /login` — form-urlencoded (`username`/`password`), no JSON |

En `POST` de mesas, productos, categorías y usuarios el `id_restaurante` sale
**del token**, no del cuerpo ni de la query: un admin no puede crear datos en
el local de otro.

## Convenciones que hay que respetar

**Todo el código y los comentarios están en español.** Mantenerlo así.

**`services/api.js` es la única puerta al backend.** Ningún componente hace `fetch`.
Cada función tiene un `try/catch` con **fallback a datos mock en `localStorage`**, para
que la demo funcione con el backend apagado. Al agregar un endpoint, agregar también su
rama mock. Timeout de 1500 ms vía `fetchWithTimeout`.

**Tres excepciones deliberadas al fallback mock**: `loginStaff`, `pedirAdmin`
(todo el panel de administración) y el 401 de `verificarSesion`. Un respaldo local
en el login sería otra vez un PIN cableado, y en administración haría creer que se
guardó algo que nunca se guardó. Si el backend está apagado, esas pantallas fallan
a propósito.

**Sesión del personal**: `POST /api/auth/login` → se guarda en `localStorage`
(`swifttable_sesion_staff`). `authHeaders()` adjunta el Bearer; `verificarSesion(res)`
corta la sesión y vuelve al login si el backend responde 401 (el token dura 60 min).

**Enviar un pedido son dos pasos**: `POST /pedidos/` (cabecera) y luego un
`POST /detalles_pedido/` por producto. `PedidoCreate` no acepta un campo `items`.

**Sistema visual "modo sala"** (nace de `SwiftTable Rediseño.dc.html`, en la raíz):
fondo berenjena, tokens `--st-*` y clases `.st-*` en `index.css`. Los tokens viejos
conviven a propósito con los nuevos — no borrarlos. El acento del local es
`--st-accent`, lo pinta `aplicarAcento(idRestaurante)` de `theme/sala.js`.
Los comensales se dibujan con `<Monograma>` (ficha de color + inicial), **nunca emojis**.

**Multi-restaurante**: el `id_restaurante` activo vive en `localStorage` y viaja como
query param `?id_restaurante=` en los GET de listado. Sin ese filtro un local ve las
mesas de todos los demás.

**Claves de `localStorage`**: `swifttable_user`, `swifttable_carrito`,
`swifttable_id_restaurante`, `swifttable_nombre_restaurante`, `swifttable_sesion_staff`,
`swifttable_v2_clean`, más los `swifttable_mock_*` del fallback.

## Deuda técnica y pendientes (en orden de valor)

1. ⚠ **`Backend/App/Core/config.py` tiene la contraseña de Supabase en claro** y está en
   el historial de git. Moverla a `.env` no basta: **hay que rotarla en Supabase**
   antes de cualquier despliegue público.
2. ⚠ **`SECRET_KEY` del JWT está cableada** en `App/Core/security.py`
   (`"swift_table_super_secret_key_123"`) y versionada. Debe salir de `.env`.
3. **Alembic está desincronizado** con el esquema real (ver arriba). O se regenera la
   migración desde los modelos actuales, o se elimina la carpeta para no confundir.
4. **`seed.py` está roto**: crea filas sin `id_restaurante` (NOT NULL) y usa
   `Base.metadata.create_all()`, que main.py evita a propósito.
5. **No hay pasarela de pago**: el botón "Pagar" del cliente solo avisa al mozo.
6. **No hay tests.**
7. Los `.pyc` de `__pycache__/` están versionados en git.

**Hecho el 30-07-2026** (pendiente de verificación en runtime — ver más abajo):
cobro por mesa con boleta correcta, login real de staff con JWT + rutas protegidas,
cierre de sesión del comensal, y panel de administración `/admin`.

El ciclo pedir → cocina → servir → cobrar funciona de punta a punta.

## Antes de correr el proyecto por primera vez tras el 30-07-2026

1. Pegar `Backend/migraciones_sql/2026-07-30_pedidos_id_pago.sql` en el SQL Editor
   de Supabase. **Sin esto el backend falla**: los modelos leen `pedidos.id_pago`.
2. `cd Backend; python crear_staff.py` — sin esto no se puede entrar al panel,
   porque las contraseñas del poblado están en texto plano y `auth.py` usa bcrypt.
   Credenciales resultantes: `admin@lafogata.com` / `fisi2025` y
   `admin@pizzaitalia.com` / `italia2025`.
3. Para desplegar, poner `FRONTEND_URL` en el `.env` del backend: si no, los QR
   impresos apuntan a `localhost:5173`.
