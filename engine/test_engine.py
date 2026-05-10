"""
Tests del motor — Isaac Moreno, 11/02/1994, 01:05, Hermosillo, México.

Corre sin pytest: python engine/test_engine.py
Sección 1: tests unitarios (numerology + matriz, sin red ni Kerykeion)
Sección 2: test de integración (dataset completo con Kerykeion)
"""
import sys
import json
import traceback
from pathlib import Path

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).parent))

from numerology import (
    life_path, expression_number, soul_urge,
    personality_number, chinese_zodiac, compute_numerology,
)
from matriz import _reduce as mreduce, compute_matriz

PASS = "  PASS"
FAIL = "  FAIL"
ERR  = " ERROR"

passed = 0
failed = 0


def check(label: str, got, expected):
    global passed, failed
    if got == expected:
        print(f"{PASS}  {label}")
        passed += 1
    else:
        print(f"{FAIL}  {label}")
        print(f"         esperado: {expected!r}")
        print(f"         obtenido: {got!r}")
        failed += 1


def run(label: str, fn):
    global passed, failed
    try:
        fn()
    except AssertionError as e:
        print(f"{FAIL}  {label}: {e}")
        failed += 1
    except Exception:
        print(f"{ERR}  {label}")
        traceback.print_exc()
        failed += 1


# ════════════════════════════════════════════════════════════════════════════
# SECCIÓN 1 — Numerología (sin dependencias externas)
# ════════════════════════════════════════════════════════════════════════════

print("\n── Numerología ─────────────────────────────────────────────────────────")

# Camino de vida: 1+1+0+2+1+9+9+4 = 27 → 9
check("life_path(11, 2, 1994) == 9",
      life_path(11, 2, 1994), 9)

# Expresión (ISAAC MORENO):
#   I9 S1 A1 A1 C3 = 15  |  M4 O6 R9 E5 N5 O6 = 35  →  50 → 5
check("expression_number('Isaac Moreno') == 5",
      expression_number("Isaac Moreno"), 5)

# Alma (vocales: I, A, A, O, E, O):
#   9+1+1+6+5+6 = 28 → 10 → 1
check("soul_urge('Isaac Moreno') == 1",
      soul_urge("Isaac Moreno"), 1)

# Personalidad (consonantes: S, C, M, R, N):
#   1+3+4+9+5 = 22 → Master Number 22 (se preserva)
check("personality_number('Isaac Moreno') == 22",
      personality_number("Isaac Moreno"), 22)

# Zodiaco chino: CNY 1994 = 10/Feb → nacido 11/Feb → año 1994 efectivo
# (1994-4)%12 = 1990%12 = 10 → Perro | (1994-4)%10 = 0 → Madera
zc = chinese_zodiac(1994, 2, 11)
check("zodiaco_chino animal == 'Perro'",   zc["animal"],   "Perro")
check("zodiaco_chino elemento == 'Madera'", zc["elemento"], "Madera")
check("zodiaco_chino descripcion",
      zc["descripcion"], "Perro de Madera")

# ════════════════════════════════════════════════════════════════════════════
# SECCIÓN 2 — Matriz del Destino (sin dependencias externas)
# ════════════════════════════════════════════════════════════════════════════

print("\n── Matriz del Destino ──────────────────────────────────────────────────")

# _reduce: 23 → 2+3 = 5
check("_reduce(23) == 5",  mreduce(23), 5)
check("_reduce(18) == 18", mreduce(18), 18)
check("_reduce(22) == 22", mreduce(22), 22)
check("_reduce(0)  == 22", mreduce(0),  22)

m = compute_matriz(11, 2, 1994, current_year=2026)

# A = 11 (día ≤ 22)
check("core A == 11 (El Mago)",  m["core"]["A"]["n"], 11)
# B = 2 (mes)
check("core B == 2  (La Sacerdotisa)", m["core"]["B"]["n"], 2)
# C = reduce(1+9+9+4=23) = 5
check("core C == 5  (El Hierofante)", m["core"]["C"]["n"], 5)
# G = reduce(11+2+5=18)  = 18
check("core G == 18 (La Luna)",  m["core"]["G"]["n"], 18)
check("core G nombre == 'La Luna'", m["core"]["G"]["nombre"], "La Luna")

# Arcano activo 2026: reduce(2+0+2+6=10); reduce(11+2+10=23→5)
check("arcano_activo 2026 == 5 (El Hierofante)",
      m["arcano_activo"]["arcano"], 5)
check("arcano_activo nombre",
      m["arcano_activo"]["nombre"], "El Hierofante")

# Timeline existe para 2026-2031
check("timeline contiene 2026", 2026 in m["timeline"], True)
check("timeline contiene 2031", 2031 in m["timeline"], True)

# ════════════════════════════════════════════════════════════════════════════
# SECCIÓN 3 — Integración completa con Kerykeion (dataset.py)
# ════════════════════════════════════════════════════════════════════════════

print("\n── Integración — dataset completo ──────────────────────────────────────")

try:
    from dataset import build_dataset, CITIES

    geo = CITIES["hermosillo"]
    dataset = build_dataset(
        name="Isaac Moreno",
        day=11, month=2, year=1994,
        hour=1, minute=5,
        **geo,
        current_year=2026,
    )

    r = dataset["resumen"]

    check("signo_solar == 'Acuario'",   r["signo_solar"],   "Acuario")
    check("camino_de_vida == 9",        r["camino_de_vida"], 9)
    check("numero_expresion == 5",      r["numero_expresion"], 5)
    check("zodiaco_chino",              r["zodiaco_chino"], "Perro de Madera")
    check("arcano_centro == 18",        r["arcano_centro"], 18)
    check("arcano_activo == 5",         r["arcano_activo"], 5)

    # Ascendente y MC solo verificamos que no estén vacíos
    def _has_ascendant():
        assert r["ascendente"], "Ascendente vacío"
    def _has_mc():
        assert r["medio_cielo"], "Medio cielo vacío"
    run("ascendente calculado", _has_ascendant)
    run("medio_cielo calculado", _has_mc)

    print("\n── JSON resumen ─────────────────────────────────────────────────────────")
    print(json.dumps(dataset["resumen"], ensure_ascii=False, indent=2))

    print("\n── Planetas ─────────────────────────────────────────────────────────────")
    for key, planet in dataset["astro"]["planets"].items():
        retro = " ℞" if planet["retrograde"] else ""
        print(f"  {planet['name_es']:12s}  {planet['sign']:12s}  "
              f"{planet['degrees']:6.2f}°  casa {planet['house']}{retro}")

    print(f"\n  Ascendente  {dataset['astro']['ascendant']['sign']:12s}  "
          f"{dataset['astro']['ascendant']['degrees']:.2f}°")
    print(f"  Medio Cielo {dataset['astro']['midheaven']['sign']:12s}  "
          f"{dataset['astro']['midheaven']['degrees']:.2f}°")

    print("\n── Arcanos por año ──────────────────────────────────────────────────────")
    for yr, entry in dataset["matriz"]["timeline"].items():
        marker = " ◀ activo" if int(yr) == 2026 else ""
        print(f"  {yr}  Arcano {entry['arcano']:2d}  {entry['nombre']}{marker}")

except Exception:
    print(f"{ERR}  Integración con Kerykeion falló")
    traceback.print_exc()
    failed += 1

# ════════════════════════════════════════════════════════════════════════════

print(f"\n{'─'*72}")
print(f"  {passed} passed   {failed} failed")
print(f"{'─'*72}\n")

sys.exit(0 if failed == 0 else 1)
