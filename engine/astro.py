from kerykeion import AstrologicalSubject

SIGN_ES = {
    # 3-letter abbreviations (older Kerykeion)
    "Ari": "Aries", "Tau": "Tauro", "Gem": "Géminis", "Can": "Cáncer",
    "Leo": "Leo",   "Vir": "Virgo", "Lib": "Libra",   "Sco": "Escorpio",
    "Sag": "Sagitario", "Cap": "Capricornio", "Aqu": "Acuario", "Pis": "Piscis",
    # Full English names (newer Kerykeion)
    "Aries": "Aries", "Taurus": "Tauro", "Gemini": "Géminis", "Cancer": "Cáncer",
    "Virgo": "Virgo", "Libra": "Libra", "Scorpio": "Escorpio",
    "Sagittarius": "Sagitario", "Capricorn": "Capricornio",
    "Aquarius": "Acuario", "Pisces": "Piscis",
}

PLANETS_ES = {
    "sun": "Sol", "moon": "Luna", "mercury": "Mercurio", "venus": "Venus",
    "mars": "Marte", "jupiter": "Júpiter", "saturn": "Saturno",
    "uranus": "Urano", "neptune": "Neptuno", "pluto": "Plutón",
}

PLANETS = list(PLANETS_ES.keys())


def _sign_es(sign: str) -> str:
    return SIGN_ES.get(sign, sign)


def compute_astro(
    name: str,
    year: int, month: int, day: int,
    hour: int, minute: int,
    lat: float, lng: float, tz_str: str,
) -> dict:
    subject = AstrologicalSubject(
        name, year, month, day, hour, minute,
        lat=lat, lng=lng, tz_str=tz_str,
        online=False,
    )

    planets = {}
    for key in PLANETS:
        obj = getattr(subject, key)
        planets[key] = {
            "name_es": PLANETS_ES[key],
            "sign": _sign_es(obj.sign),
            "degrees": round(obj.position, 2),
            "house": obj.house,
            "retrograde": bool(obj.retrograde),
        }

    return {
        "planets": planets,
        "ascendant": {
            "sign": _sign_es(subject.first_house.sign),
            "degrees": round(subject.first_house.position, 2),
        },
        "midheaven": {
            "sign": _sign_es(subject.tenth_house.sign),
            "degrees": round(subject.tenth_house.position, 2),
        },
    }
