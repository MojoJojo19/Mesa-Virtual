# Guía de Usuario - Mesa Virtual (SwiftTable)

Esta guía detalla el funcionamiento y los casos de uso para los dos perfiles principales del sistema: **Comensal (Diner)** y **Administrador / Personal (Staff)**.

---

## 📖 Sección I: Guía para el Comensal (Diner)

El flujo del comensal está diseñado para ser interactivo, rápido y con la menor fricción posible. Puede realizarse directamente desde la tableta fija de la mesa, o de forma individual y sincronizada desde el celular de cada cliente.

### Caso de Uso 1: Acceso a la Mesa mediante Código QR (Bypass de PIN)
Este caso se da cuando un cliente escanea el código QR desde su propio celular (sea el QR impreso en el acrílico o el QR que se muestra en la pantalla de la tableta).
1. El cliente apunta la cámara de su celular al código QR.
2. El celular abre la URL del sistema: `https://tudominio.com/mesa/{id_mesa}?token={token_activo}`.
3. La aplicación detecta el `token` de seguridad activo en la URL, lo valida con el servidor en segundo plano y **omite la pantalla de ingreso de PIN**.
4. El cliente es redirigido directamente a la pantalla de registro de nombre.

### Caso de Uso 2: Acceso Manual a la Mesa (Con PIN)
Este caso ocurre si el cliente accede escribiendo la dirección URL directamente sin escanear el QR con token (ej: `https://tudominio.com/mesa/3`).
1. El cliente entra a la URL y ve la pantalla de **Bienvenida**.
2. Presiona el botón **Ingresar a la Mesa**.
3. Se muestra un teclado numérico táctil de seguridad. El cliente debe digitar el **PIN de 4 dígitos** asignado a la mesa (el cual se encuentra visible en la pantalla de la tableta de la mesa o es proporcionado por el mesero).
4. Si el PIN coincide con el activo en la base de datos, el sistema concede el acceso.

### Caso de Uso 3: Registro de Comensal y Lobby de Espera
Una vez dentro de la mesa:
1. El cliente selecciona su **avatar animado** (gato, perro, zorro, etc.) y escribe su **nombre**.
2. Presiona **Entrar a la mesa**.
   * Si es el primero en entrar, se le asigna el rol de **Líder de Mesa**.
   * Si ya hay otra persona dentro, ingresa como **Acompañante**.
3. Todos los comensales ingresan al **Lobby de Espera**, donde pueden visualizar en tiempo real quiénes se van conectando a la sesión de la mesa.

### Caso de Uso 4: Conectar celulares acompañantes (QR en Tableta)
Cuando se utiliza la tableta fija de la mesa para pedir platos en grupo:
1. En la pantalla del **Lobby de la tableta**, aparecerá una tarjeta destacada con un código QR dinámico.
2. En la pantalla del **Menú de la tableta**, los clientes pueden presionar el **icono de código QR** en la barra superior en cualquier momento, abriendo un modal emergente.
3. Los acompañantes escanean ese QR desde sus propios celulares para sincronizarse instantáneamente con la sesión de la mesa (Mesa 3) y el carrito compartido.

### Caso de Uso 5: Selección de platos del Menú
1. Los clientes navegan el menú categorizado (Pollos, Bebidas, Entradas, Postres).
2. Para añadir platos, presionan **Agregar** o el botón **+**. El plato se ilumina con bordes oscuros reflejando que ya se encuentra en el carrito.
3. El carrito se actualiza y sincroniza en tiempo real entre todos los celulares de la mesa y la tableta fija.

### Caso de Uso 6: Envío de Pedido Grupal a Cocina
1. Cuando todos han seleccionado sus platos, el **Líder** de la mesa presiona **Revisar Pedido** y accede a la pantalla de **Pedido Grupal**.
2. En esta pantalla se consolida el total de platos seleccionados por cada miembro de la mesa.
3. El Líder presiona **Enviar Pedido a Cocina**.
4. El pedido se registra en la base de datos y se notifica inmediatamente a la cocina.
5. El cliente es redirigido a la pantalla de seguimiento `/confirmado`.

### Caso de Uso 7: Monitoreo en Tiempo Real
1. En la pantalla de seguimiento de pedido, el comensal puede ver el estado actual del pedido:
   * **En Cocina / Preparando:** El chef está preparando los platos.
   * **Listo en Barra / ¡Listo!:** Los platos salieron de la cocina y el mesero los está llevando a la mesa.
2. Si el administrador del restaurante libera la mesa (ej: al pagar), la sesión de la tableta y los celulares se cierra automáticamente, regresándolos a la pantalla de inicio limpia.

### Caso de Uso 8: Llamado al Mozo y Solicitudes Especiales
En cualquier momento de la comida, el cliente puede tocar el botón de **Campana** en la barra superior para abrir el menú de solicitudes express:
* **Llamado General:** Asistencia general del mesero.
* **Traer Cubiertos:** Solicitar tenedor, cuchillo o cuchara.
* **Traer Servilletas:** Solicitar servilletas extras.
* **Traer Hielo:** Solicitar cubos de hielo.
* **Retirar Platos:** Solicitar la limpieza de vajilla sucia de la mesa.
La alerta se envía al panel de logística del personal al instante.

### Caso de Uso 9: Pago, Propina Personalizada y Cierre
1. El comensal toca **Ver Resumen y Pagar**.
2. Selecciona la propina sugerida (0%, 5%, 10%) o presiona **Otros**.
3. Al presionar **Otros**, escribe el monto exacto en Soles (S/) que desea dejar.
4. Selecciona el método de pago (Efectivo, Tarjeta, Yape/Plin).
5. Presiona **Confirmar Pago**. El pago queda registrado en la caja del restaurante.

---

## 💼 Sección 2: Guía para el Administrador / Personal (Staff)

El módulo del administrador permite al personal de salón (mozos), cocina y caja operar de forma coordinada desde un solo panel dinámico (`/logistica`).

### Caso de Uso 1: Ingreso de Seguridad
1. El personal ingresa al selector de rol en la app y selecciona **Soy Personal del Restaurante**.
2. Introduce su PIN de empleado de 4 dígitos:
   * **La Fogata:** PIN `1234`
   * **Pizzería Italia:** PIN `4321`
3. Al ingresar, el panel se personaliza automáticamente con la información del restaurante seleccionado.

### Caso de Uso 2: Mapa de Mesas y Estado de Salón
La pestaña **Salón** muestra un mapa visual de las mesas organizadas por número:
* **Color Blanco / Libre:** Mesa desocupada.
* **Color Gris / Ocupada:** Hay comensales activos consumiendo.
* **Color Naranja Parpadeante / Llamando:** La mesa ha solicitado un llamado al mozo o alguna alerta express.
* **Color Azul / ¡Listo!:** Hay platos listos en cocina que deben ser servidos a esa mesa.

### Caso de Uso 3: Gestión de Llamados (Mozos)
1. En la parte inferior del mapa de salón se listan los llamados activos por orden de llegada con contador de tiempo relativo (ej: *Hace 1m 12s*).
2. El mesero acude a la mesa física indicada.
3. Una vez atendido el requerimiento, el mesero presiona el botón **Atender** en el panel de Logística para limpiar la alerta del sistema.

### Caso de Uso 4: Pantalla de Cocina (KDS - Kitchen Display System)
1. El personal de cocina selecciona la pestaña **Cocina** en la parte superior del panel.
2. Visualiza las comandas entrantes con el número de mesa, ID de pedido y desglose detallado de los platos con sus cantidades.
3. Cuando el cocinero termina de preparar el pedido, presiona **¡Listo en Barra!**.
4. La comanda se quita de la pantalla de cocina y la mesa correspondiente en el mapa de salón se ilumina de color azul parpadeante con una alerta de plato listo para que el mesero lo sirva.

### Caso de Uso 5: Caja Registradora y Historial de Boletas
1. El cajero selecciona la pestaña **Caja** en la parte superior.
2. Visualiza las estadísticas de venta consolidadas en tiempo real:
   * Total de Ventas del día en Soles (S/).
   * Total de Propinas acumuladas.
   * Desglose por método de pago (Efectivo, Tarjeta, Yape/Plin).
3. En la lista de transacciones, puede hacer clic en **Ver Ticket** de cualquier pago realizado para visualizar una boleta de venta electrónica formateada en tipografía monoespaciada lista para impresión física.

### Caso de Uso 6: Impresión de Stands QR Físicos
Si el restaurante necesita renovar o imprimir el stand de acrílico de una mesa:
1. En la pestaña **Salón**, el administrador hace clic en la mesa que desea imprimir.
2. Se abre la barra lateral de detalles donde se visualiza el **QR Activo** de la mesa.
3. El administrador presiona **Imprimir QR de Mesa**.
4. Se abre una ventana emergente limpia y formateada para impresión física que contiene:
   * Título del Restaurante.
   * Número de Mesa en tamaño grande.
   * El código QR de acceso directo (contiene el token actual de sesión).
   * El PIN de respaldo de 4 dígitos.
5. Presiona `Ctrl + P` o el diálogo de impresión automática para mandarlo a la impresora.

### Caso de Uso 7: Liberación de Mesa y Regeneración de Seguridad
Cuando una mesa se retira o se completa el pago:
1. El personal hace clic en la mesa activa en el panel de salón.
2. Presiona **Cerrar Cuenta y Liberar Mesa** o **Registrar Pago en Caja y Cerrar Mesa**.
3. El sistema realiza las siguientes acciones automáticas en la base de datos:
   * Cambia el estado de la mesa a `libre`.
   * Expulsa a todos los comensales asociados a la sesión.
   * **Genera un PIN de 4 dígitos completamente nuevo y aleatorio.**
   * **Genera un `token_sesion` dinámico nuevo para el código QR.**
   * Actualiza el código QR en la pantalla de la tableta.
4. A partir de ese momento, los códigos de la sesión anterior quedan inhabilitados y la mesa queda limpia para recibir nuevos comensales.
