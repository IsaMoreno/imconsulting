"""
Matriz del Destino — calcula los puntos del octograma y la línea de arcanos por año.
Los 22 Arcanos Mayores se numeran 1-22 (el 22 corresponde al Loco/0 en Tarot clásico).
"""
import datetime

ARCANA = {
    1:  "El Mago",
    2:  "La Sacerdotisa",
    3:  "La Emperatriz",
    4:  "El Emperador",
    5:  "El Hierofante",
    6:  "Los Amantes",
    7:  "El Carro",
    8:  "La Justicia",
    9:  "El Ermitaño",
    10: "La Rueda de la Fortuna",
    11: "La Fuerza",
    12: "El Colgado",
    13: "La Muerte",
    14: "La Templanza",
    15: "El Diablo",
    16: "La Torre",
    17: "La Estrella",
    18: "La Luna",
    19: "El Sol",
    20: "El Juicio",
    21: "El Mundo",
    22: "El Loco",
}

ZOHAR_LABEL = {
    "A": "Energía personal (día)",
    "B": "Energía emocional (mes)",
    "C": "Energía espiritual (año)",
    "G": "Centro / Misión del alma",
}


def _reduce(n: int) -> int:
    """Reduce n a rango 1-22 sumando dígitos repetidamente. 0 → 22."""
    while n > 22:
        n = sum(int(d) for d in str(n))
    return n if n != 0 else 22


def _arcano(n: int) -> dict:
    return {"n": n, "nombre": ARCANA[n]}


def compute_matriz(
    day: int, month: int, year: int,
    current_year: int | None = None,
) -> dict:
    if current_year is None:
        current_year = datetime.date.today().year

    year_digits = sum(int(d) for d in str(year))

    A = _reduce(day)
    B = _reduce(month)
    C = _reduce(year_digits)
    G = _reduce(A + B + C)

    # Octograma — puntos derivados del centro y los cuatro ejes
    sky   = _reduce(A + G)       # Cielo (eje personal-alma)
    earth = _reduce(C + G)       # Tierra (eje espiritual-alma)
    left  = _reduce(B + G)       # Izquierda (eje emocional-alma)
    right = _reduce(A + C)       # Derecha (eje personal-espiritual)
    tl    = _reduce(A + B)       # Diagonal superior-izquierda
    tr    = _reduce(B + C)       # Diagonal superior-derecha

    # Arcano del año personal: reduce(A + B + dígitos_del_año)
    def _year_arcano(yr: int) -> dict:
        yr_digits = _reduce(sum(int(d) for d in str(yr)))
        arc = _reduce(A + B + yr_digits)
        return {"año": yr, "arcano": arc, "nombre": ARCANA[arc]}

    timeline = {yr: _year_arcano(yr) for yr in range(current_year, current_year + 6)}

    return {
        "core": {
            "A": {**_arcano(A), "label": ZOHAR_LABEL["A"]},
            "B": {**_arcano(B), "label": ZOHAR_LABEL["B"]},
            "C": {**_arcano(C), "label": ZOHAR_LABEL["C"]},
            "G": {**_arcano(G), "label": ZOHAR_LABEL["G"]},
        },
        "octagram": {
            "sky":        _arcano(sky),
            "earth":      _arcano(earth),
            "left":       _arcano(left),
            "right":      _arcano(right),
            "top_left":   _arcano(tl),
            "top_right":  _arcano(tr),
        },
        "arcano_activo": timeline[current_year],
        "timeline": timeline,
    }
