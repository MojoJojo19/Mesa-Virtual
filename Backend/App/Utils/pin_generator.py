import random


def generar_pin() -> str:
    """
    Genera un PIN numérico de 4 dígitos (como string, para no perder ceros a la izquierda).
    """
    return f"{random.randint(0, 9999):04d}"
