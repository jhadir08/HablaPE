import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

IDIOMAS_SOPORTADOS = {"es", "en", "qu", "ay"}

# Map of language codes to Cloud Translation ISO codes if different
CODE_MAP = {
    "es": "es",
    "en": "en",
    "qu": "qu",
    "ay": "ay",
}


@lru_cache(maxsize=1)
def _get_translate_client():
    """Obtiene o inicializa el cliente de Google Cloud Translation (v2)."""
    try:
        import importlib
        translate_mod = importlib.import_module("google.cloud.translate_v2")
        return translate_mod.Client()
    except (ImportError, ModuleNotFoundError) as e:
        logger.warning(f"[traduccion] Librería 'google-cloud-translate' no instalada en este entorno: {e}")
        return None
    except Exception as e:
        logger.warning(f"[traduccion] No se pudo inicializar cliente de Google Cloud Translation: {e}")
        return None


def traducir(texto: str | None, destino: str, origen: str = "es") -> str:
    """
    Traduce 'texto' desde 'origen' hacia 'destino'.
    
    Reglas de seguridad:
    - Si el texto está vacío o es None, retorna el texto original.
    - Si destino == origen (ej. 'es' -> 'es'), NO hace nada y retorna el texto original.
    - Si el idioma destino no está soportado, retorna el texto original.
    - Si la API falla por cualquier motivo, degrada suavemente devolviendo el texto original.
    """
    if not texto or not texto.strip():
        return texto or ""

    destino_clean = CODE_MAP.get(destino.lower(), destino.lower())
    origen_clean = CODE_MAP.get(origen.lower(), origen.lower())

    if destino_clean == origen_clean or destino_clean not in IDIOMAS_SOPORTADOS:
        return texto

    client = _get_translate_client()
    if not client:
        logger.warning("[traduccion] Cliente no disponible. Retornando texto original.")
        return texto

    try:
        resultado = client.translate(
            texto,
            target_language=destino_clean,
            source_language=origen_clean,
            format_="text",
        )
        return resultado.get("translatedText", texto)
    except Exception as e:
        logger.error(f"[traduccion] Error al traducir ({origen_clean} -> {destino_clean}): {e}")
        return texto


def traducir_lista(items: list[str], destino: str, origen: str = "es") -> list[str]:
    """Traduce una lista de cadenas preservando el orden y la estructura."""
    if not items or destino == origen or destino not in IDIOMAS_SOPORTADOS:
        return items

    return [traducir(item, destino=destino, origen=origen) for item in items]
