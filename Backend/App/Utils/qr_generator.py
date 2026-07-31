import qrcode
import os
from App.Core.config import FRONTEND_URL

# Carpeta donde se guardarán las imágenes QR
QR_DIRECTORY = "App/Static/QRs"

# Asegurarnos de que la carpeta exista al arrancar
os.makedirs(QR_DIRECTORY, exist_ok=True)

def generar_qr_mesa(id_mesa: int) -> str:
    """
    Genera un QR para una mesa específica y devuelve la ruta web de la imagen.
    """
    # URL a la que llega el comensal al escanear el QR con su cámara.
    # Sale de FRONTEND_URL (.env) para que el QR impreso sirva también fuera
    # de la máquina de desarrollo.
    url_mesa = f"{FRONTEND_URL}/mesa/{id_mesa}"
    
    # Configurar la estética del QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url_mesa)
    qr.make(fit=True)

    # Crear la imagen final del QR
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Nombre del archivo
    nombre_archivo = f"mesa_{id_mesa}.png"
    ruta_guardado = os.path.join(QR_DIRECTORY, nombre_archivo)
    
    # Guardar foto en disco duro
    img.save(ruta_guardado)
    
    # Devolver la ruta web para que PostgreSQL la guarde
    return f"/static/QRs/{nombre_archivo}"
