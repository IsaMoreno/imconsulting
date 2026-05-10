"""
dataset.py — motor principal del sistema IM Consulting.

Orquesta astro.py + matriz.py + numerology.py y produce el JSON completo
que alimenta generate-report.js para la generación de bloques.

Uso directo:
    python engine/dataset.py
"""
import json
import sys
import datetime
from pathlib import Path

# Permite importar módulos hermanos cuando se llama desde la raíz del proyecto
sys.path.insert(0, str(Path(__file__).parent))

from astro import compute_astro
from matriz import compute_matriz
from numerology import compute_numerology

# ── Coordenadas de ciudades frecuentes ───────────────────────────────────────

CITIES = {
    "hermosillo": {
        "lat": 29.0729673, "lng": -110.9559192,
        "tz_str": "America/Hermosillo",
        "ciudad": "Hermosillo", "estado": "Sonora", "pais": "México",
    },
    "cdmx": {
        "lat": 19.4326077, "lng": -99.1332756,
        "tz_str": "America/Mexico_City",
        "ciudad": "Ciudad de México", "estado": "CDMX", "pais": "México",
    },
    "guadalajara": {
        "lat": 20.6596988, "lng": -103.3496092,
        "tz_str": "America/Mexico_City",
        "ciudad": "Guadalajara", "estado": "Jalisco", "pais": "México",
    },
    "monterrey": {
        "lat": 25.6866142, "lng": -100.3161126,
        "tz_str": "America/Monterrey",
        "ciudad": "Monterrey", "estado": "Nuevo León", "pais": "México",
    },
}


# ── Función principal ────────────────────────────────────────────────────────

def build_dataset(
    name: str,
    day: int, month: int, year: int,
    hour: int, minute: int,
    lat: float, lng: float, tz_str: str,
    ciudad: str = "", estado: str = "", pais: str = "",
    current_year: int | None = None,
) -> dict:
    if current_year is None:
        current_year = datetime.date.today().year

    astro       = compute_astro(name, year, month, day, hour, minute, lat, lng, tz_str)
    matriz      = compute_matriz(day, month, year, current_year)
    numerologia = compute_numerology(name, day, month, year)

    lugar = ", ".join(p for p in [ciudad, estado, pais] if p)

    return {
        "meta": {
            "generado": datetime.datetime.now().isoformat(timespec="seconds"),
            "año_referencia": current_year,
        },
        "cliente": {
            "nombre":           name,
            "fecha_nacimiento": f"{day:02d}/{month:02d}/{year}",
            "hora_nacimiento":  f"{hour:02d}:{minute:02d}",
            "lugar_nacimiento": lugar,
        },
        "astro":       astro,
        "numerologia": numerologia,
        "matriz":      matriz,
        # ── Resumen plano para lookup rápido desde generate-report.js ──
        "resumen": {
            "signo_solar":          astro["planets"]["sun"]["sign"],
            "ascendente":           astro["ascendant"]["sign"],
            "medio_cielo":          astro["midheaven"]["sign"],
            "zodiaco_chino":        numerologia["zodiaco_chino"]["descripcion"],
            "camino_de_vida":       numerologia["camino_de_vida"],
            "numero_expresion":     numerologia["expresion"],
            "numero_alma":          numerologia["alma"],
            "numero_personalidad":  numerologia["personalidad"],
            "arcano_centro":        matriz["core"]["G"]["n"],
            "arcano_centro_nombre": matriz["core"]["G"]["nombre"],
            "arcano_activo":        matriz["arcano_activo"]["arcano"],
            "arcano_activo_nombre": matriz["arcano_activo"]["nombre"],
            "año_activo":           current_year,
        },
    }


# ── Ejecución directa con datos de muestra ──────────────────────────────────

if __name__ == "__main__":
    geo = CITIES["hermosillo"]

    dataset = build_dataset(
        name="Isaac Moreno",
        day=11, month=2, year=1994,
        hour=1, minute=5,
        **geo,
    )

    print(json.dumps(dataset, ensure_ascii=False, indent=2))
