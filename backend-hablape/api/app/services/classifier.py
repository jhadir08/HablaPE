from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from app.schemas import Journey, Urgency


def _normalize(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.lower())
    return "".join(char for char in normalized if not unicodedata.combining(char))


@dataclass(frozen=True)
class Classification:
    journey: Journey
    flags: tuple[str, ...]
    urgency: Urgency


_NUMBER_WORDS = {
    "cinco": 5,
    "seis": 6,
    "siete": 7,
    "ocho": 8,
    "nueve": 9,
    "diez": 10,
    "quince": 15,
    "dieciseis": 16,
    "diecisiete": 17,
    "dieciocho": 18,
    "diecinueve": 19,
    "veinte": 20,
    "veintiun": 21,
    "veintidos": 22,
    "treinta": 30,
}


def _mentioned_hours(text: str) -> int | None:
    numeric = re.search(r"\b(\d{1,2})\s*horas?\b", text)
    if numeric:
        return int(numeric.group(1))
    for word, number in _NUMBER_WORDS.items():
        if re.search(rf"\b{word}\s+horas?\b", text):
            return number
    return None


def classify(text: str) -> Classification:
    value = _normalize(text)

    if any(
        word in value
        for word in (
            "empleador",
            "sueldo",
            "despido",
            "contrato laboral",
            "pension de alimentos",
        )
    ):
        return Classification(
            Journey.OUT_OF_SCOPE, ("laboral",), Urgency.NORMAL
        )

    if (
        "denunciar un robo" in value
        or "quien ira preso" in value
        or "defensa penal" in value
    ):
        return Classification(
            Journey.OUT_OF_SCOPE,
            ("asesoria_penal_personalizada",),
            Urgency.REVIEW_SOON,
        )

    identity_words = (
        "policia",
        "dni",
        "identificarme",
        "identific",
        "identidad",
        "comisaria",
        "intervencion policial",
    )
    if any(word in value for word in identity_words):
        flags: list[str] = []
        urgency = Urgency.NORMAL
        if any(
            phrase in value
            for phrase in (
                "no me explic",
                "no explic",
                "sin motivo",
                "porque si",
            )
        ):
            flags.append("motivo_no_informado")
        if any(
            phrase in value
            for phrase in ("no tengo el dni", "no llevaba dni", "sin dni")
        ):
            flags.append("facilidades_identificacion")
        hours = _mentioned_hours(value)
        if hours is not None and hours > 4:
            flags.extend(("posible_exceso_plazo", "escalamiento_urgente"))
            urgency = Urgency.URGENT
        if "celda" in value:
            flags.extend(
                ("posible_ingreso_indebido_celda", "escalamiento_urgente")
            )
            urgency = Urgency.URGENT
        if any(word in value for word in ("golpe", "agresion", "amenaza")):
            flags.extend(("posible_riesgo_integridad", "escalamiento_urgente"))
            urgency = Urgency.URGENT
        return Classification(
            Journey.IDENTITY, tuple(dict.fromkeys(flags)), urgency
        )

    if any(
        word in value
        for word in (
            "banco",
            "tarjeta",
            "seguro",
            "afp",
            "recibo de luz",
            "electricidad",
            "gas natural",
            "agua potable",
            "telefonia",
            "internet",
        )
    ):
        flags = ["requiere_regla_sectorial"]
        if any(word in value for word in ("banco", "tarjeta", "seguro", "afp")):
            flags.append("financiero")
        if any(
            word in value
            for word in ("recibo de luz", "electricidad", "gas natural")
        ):
            flags.append("energia")
        if "agua potable" in value:
            flags.append("agua")
        if any(word in value for word in ("telefonia", "internet")):
            flags.append("telecomunicaciones")
        return Classification(
            Journey.SECTORAL_CONSUMER, tuple(flags), Urgency.REVIEW_SOON
        )

    consumer_words = (
        "compre",
        "compra",
        "producto",
        "servicio",
        "tienda",
        "proveedor",
        "reclamo",
        "audifonos",
        "pedido",
        "garantia",
        "libro de reclamaciones",
    )
    if any(word in value for word in consumer_words):
        flags = []
        if any(
            phrase in value
            for phrase in (
                "dejo de funcionar",
                "no funciona",
                "defect",
                "fallo",
                "malogr",
            )
        ):
            flags.append("idoneidad")
        if "libro de reclamaciones" in value and any(
            phrase in value
            for phrase in ("no muestra", "no tiene", "no encuentro")
        ):
            flags.append("libro_digital")
        if any(
            phrase in value
            for phrase in (
                "veinte dias habiles",
                "20 dias habiles",
                "mas de quince dias habiles",
            )
        ):
            flags.append("posible_exceso_plazo")
        urgency = (
            Urgency.REVIEW_SOON
            if "posible_exceso_plazo" in flags
            else Urgency.NORMAL
        )
        return Classification(Journey.CONSUMER, tuple(flags), urgency)

    return Classification(
        Journey.OUT_OF_SCOPE, ("escenario_no_confirmado",), Urgency.NORMAL
    )
