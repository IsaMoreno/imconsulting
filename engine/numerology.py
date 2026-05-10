"""
Numerología Pitagórica + Zodiaco Chino.
Master numbers 11, 22, 33 se preservan donde aplica.
"""

# ── Pythagorean letter values ────────────────────────────────────────────────

PYTHAGOREAN: dict[str, int] = {
    "A": 1, "B": 2, "C": 3, "D": 4, "E": 5, "F": 6, "G": 7, "H": 8, "I": 9,
    "J": 1, "K": 2, "L": 3, "M": 4, "N": 5, "O": 6, "P": 7, "Q": 8, "R": 9,
    "S": 1, "T": 2, "U": 3, "V": 4, "W": 5, "X": 6, "Y": 7, "Z": 8,
}

VOWELS = frozenset("AEIOU")

# ── Chinese zodiac tables ────────────────────────────────────────────────────

ANIMALS_ZC = [
    "Rata", "Buey", "Tigre", "Conejo", "Dragón", "Serpiente",
    "Caballo", "Cabra", "Mono", "Gallo", "Perro", "Cerdo",
]

ELEMENTS_ZC = [
    "Madera", "Madera", "Fuego", "Fuego", "Tierra", "Tierra",
    "Metal",  "Metal",  "Agua",  "Agua",
]

# Chinese New Year dates (month, day) for years 1980-2010
CNY_DATES: dict[int, tuple[int, int]] = {
    1980: (2, 16), 1981: (2,  5), 1982: (1, 25), 1983: (2, 13),
    1984: (2,  2), 1985: (2, 20), 1986: (2,  9), 1987: (1, 29),
    1988: (2, 17), 1989: (2,  6), 1990: (1, 27), 1991: (2, 15),
    1992: (2,  4), 1993: (1, 23), 1994: (2, 10), 1995: (1, 31),
    1996: (2, 19), 1997: (2,  7), 1998: (1, 28), 1999: (2, 16),
    2000: (2,  5), 2001: (1, 24), 2002: (2, 12), 2003: (2,  1),
    2004: (1, 22), 2005: (2,  9), 2006: (1, 29), 2007: (2, 18),
    2008: (2,  7), 2009: (1, 26), 2010: (2, 14),
}


# ── Internal helpers ─────────────────────────────────────────────────────────

def _reduce(n: int) -> int:
    """Reduce to single digit, preserving master numbers 11, 22, 33."""
    while n > 9 and n not in (11, 22, 33):
        n = sum(int(d) for d in str(n))
    return n


# ── Public functions ─────────────────────────────────────────────────────────

def life_path(day: int, month: int, year: int) -> int:
    """Camino de vida: suma todos los dígitos de la fecha de nacimiento."""
    total = sum(int(d) for d in f"{day:02d}{month:02d}{year}")
    return _reduce(total)


def expression_number(full_name: str) -> int:
    """Número de expresión: suma Pitagórica de todas las letras del nombre."""
    letters = [c for c in full_name.upper() if c.isalpha()]
    return _reduce(sum(PYTHAGOREAN.get(c, 0) for c in letters))


def soul_urge(full_name: str) -> int:
    """Número del alma: suma Pitagórica de las vocales."""
    vowels = [c for c in full_name.upper() if c in VOWELS]
    return _reduce(sum(PYTHAGOREAN.get(c, 0) for c in vowels))


def personality_number(full_name: str) -> int:
    """Número de personalidad: suma Pitagórica de las consonantes."""
    consonants = [c for c in full_name.upper() if c.isalpha() and c not in VOWELS]
    return _reduce(sum(PYTHAGOREAN.get(c, 0) for c in consonants))


def chinese_zodiac(birth_year: int, birth_month: int, birth_day: int) -> dict:
    """
    Zodiaco chino con elemento.
    Ajusta para nacimientos antes del Año Nuevo Chino del año en cuestión.
    """
    cny = CNY_DATES.get(birth_year, (2, 5))
    effective_year = birth_year
    if (birth_month, birth_day) < cny:
        effective_year -= 1

    animal  = ANIMALS_ZC[(effective_year - 4) % 12]
    element = ELEMENTS_ZC[(effective_year - 4) % 10]

    return {
        "animal": animal,
        "elemento": element,
        "descripcion": f"{animal} de {element}",
    }


def compute_numerology(full_name: str, day: int, month: int, year: int) -> dict:
    return {
        "camino_de_vida":  life_path(day, month, year),
        "expresion":       expression_number(full_name),
        "alma":            soul_urge(full_name),
        "personalidad":    personality_number(full_name),
        "zodiaco_chino":   chinese_zodiac(year, month, day),
    }
