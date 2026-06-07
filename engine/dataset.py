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

# ── IMPORTAR COMPRESIÓN ──────────────────────────────────────────────────────
from compress_dataset import comprimir_dataset, analizar_compresion

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
    comprimir: bool = True,
) -> dict:
    if current_year is None:
        current_year = datetime.date.today().year

    astro       = compute_astro(name, year, month, day, hour, minute, lat, lng, tz_str)
    matriz      = compute_matriz(day, month, year, current_year)
    numerologia = compute_numerology(name, day, month, year)
    lugar = ", ".join(p for p in [ciudad, estado, pais] if p)

    dataset = {
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

    if comprimir:
        dataset_original_size = len(json.dumps(dataset).encode("utf-8"))
        dataset = comprimir_dataset(dataset)
        dataset_comprimido_size = len(json.dumps(dataset).encode("utf-8"))
        
        ahorro = dataset_original_size - dataset_comprimido_size
        porcentaje = (ahorro / dataset_original_size * 100) if dataset_original_size > 0 else 0
        
        print("[COMPRESION] Antes: {} bytes, Despues: {} bytes, Ahorro: {} bytes ({:.1f}%)".format(
            dataset_original_size, dataset_comprimido_size, ahorro, porcentaje
        ))
        
        dataset["_compresion"] = {
            "aplicada": True,
            "tamaño_antes": dataset_original_size,
            "tamaño_despues": dataset_comprimido_size,
            "ahorro_bytes": ahorro,
            "ahorro_porcentaje": round(porcentaje, 1),
        }

    return dataset

if __name__ == "__main__":
    import os
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('--nombre',  default=None)
    parser.add_argument('--day',     type=int, default=None)
    parser.add_argument('--month',   type=int, default=None)
    parser.add_argument('--year',    type=int, default=None)
    parser.add_argument('--hour',    type=int, default=None)
    parser.add_argument('--minute',  type=int, default=None)
    parser.add_argument('--lat',     type=float, default=None)
    parser.add_argument('--lng',     type=float, default=None)
    parser.add_argument('--tz',      default=None)
    parser.add_argument('--ciudad',  default=None)
    parser.add_argument('--pais',    default=None)
    args = parser.parse_args()

    # Modo API: nombre provisto → imprimir JSON a stdout para Node.js
    if args.nombre is not None:
        dataset = build_dataset(
            name=args.nombre,
            day=args.day, month=args.month, year=args.year,
            hour=args.hour, minute=args.minute,
            lat=args.lat or 29.07,
            lng=args.lng or -110.96,
            tz_str=args.tz or "America/Hermosillo",
            ciudad=args.ciudad or "",
            estado="",
            pais=args.pais or "",
            comprimir=False,
        )
        # stdout = JSON limpio para Node.js
        print(json.dumps(dataset, ensure_ascii=False))
    else:
        # Modo desarrollo: datos hardcoded, guarda en tmp/
        geo = CITIES["hermosillo"]
        dataset = build_dataset(
            name="Priscilla Moreno",
            day=1, month=11, year=1990,
            hour=11, minute=7,
            **geo,
            comprimir=True,
        )
        os.makedirs("tmp", exist_ok=True)
        with open("tmp/priscilla_dataset.json", "w", encoding="utf-8") as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2)
        print("✅ Dataset guardado en tmp/priscilla_dataset.json")
