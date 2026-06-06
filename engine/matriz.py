"""
engine/matriz.py - Metodo Natalia Ladini (oficial)
Formulas verificadas contra destiny-matrix.online con 4 casos reales.
Compatible con dataset.py existente (mantiene claves del motor anterior).
"""

ARCANA = {
    1:'El Mago', 2:'La Sacerdotisa', 3:'La Emperatriz', 4:'El Emperador',
    5:'El Hierofante', 6:'Los Amantes', 7:'El Carro', 8:'La Justicia',
    9:'El Ermitanio', 10:'La Rueda', 11:'La Fuerza', 12:'El Colgado',
    13:'La Muerte', 14:'La Templanza', 15:'El Diablo', 16:'La Torre',
    17:'La Estrella', 18:'La Luna', 19:'El Sol', 20:'El Juicio',
    21:'El Mundo', 22:'El Loco'
}

def _reduce(n):
    while n > 22:
        n = (n % 10) + (n // 10)
    return 22 if n == 0 else n

def _pt(n):
    """Crea un punto con numero y nombre del arcano."""
    return {"n": n, "nombre": ARCANA.get(n, ''), "label": str(n)}


def build_matriz(dia, mes, anio, current_year=None):
    A = _reduce(dia)
    B = _reduce(mes)
    C = _reduce(sum(int(d) for d in str(anio)))
    D = _reduce(A + B + C)
    E = _reduce(A + B + C + D)

    # Esquinas del cuadrado interno (formulas Ladini)
    F = _reduce(A + B)   # sup-izq
    G = _reduce(B + C)   # sup-der
    H = _reduce(C + D)   # inf-der
    I = _reduce(D + A)   # inf-izq

    # Mid-radios (entre cardinal y centro)
    J = _reduce(A + E)
    K = _reduce(B + E)
    L = _reduce(C + E)
    M = _reduce(D + E)

    # Segundos mid-radios
    qA = _reduce(A + J)
    qB = _reduce(B + K)
    qC = _reduce(C + L)
    qD = _reduce(D + M)

    # Cronologia: arcano por año de vida (0-80)
    # Formula: cada ciclo de 22 años se mapea a los arcanos
    import datetime
    year_now = current_year or datetime.datetime.now().year
    edad_actual = year_now - anio

    def arcano_edad(edad):
        if edad < 0:
            return None
        # Posicion en ciclo de 22
        pos = (edad % 22) + 1
        return _reduce(pos)

    timeline = {}
    for yr in range(year_now, year_now + 6):
        edad = yr - anio
        n = arcano_edad(edad)
        timeline[str(yr)] = {"anio": yr, "edad": edad, "arcano": n, "nombre": ARCANA.get(n, '')}

    arcano_activo_n = arcano_edad(edad_actual)

    return {
        # Datos crudos para graficos.js
        "raw": {"dia": dia, "mes": mes, "anio": anio},

        # Core — claves nuevas (A-E) + aliases del motor viejo
        "core": {
            "A": _pt(A),   # Dia
            "B": _pt(B),   # Mes
            "C": _pt(C),   # Anio
            "D": _pt(D),   # Base
            "E": _pt(E),   # Centro
            "G": _pt(E),   # alias viejo: G era el centro
        },

        # Octagram — claves del motor viejo para compatibilidad
        "octagram": {
            "sky":          _pt(B),   # Mes (arriba)
            "earth":        _pt(D),   # Base (abajo)
            "left":         _pt(A),   # Dia (izquierda)
            "right":        _pt(C),   # Anio (derecha)
            "top_left":     _pt(F),
            "top_right":    _pt(G),
            "bottom_left":  _pt(I),
            "bottom_right": _pt(H),
        },

        # Arcano activo (año actual)
        "arcano_activo": {
            "arcano": arcano_activo_n,
            "nombre": ARCANA.get(arcano_activo_n, ''),
            "edad":   edad_actual,
            "anio":   year_now,
        },

        # Cronologia proximos 6 años
        "timeline": timeline,

        # Esquinas (nomenclatura nueva)
        "esquinas": {
            "F": _pt(F), "G_corner": _pt(G),
            "H": _pt(H), "I": _pt(I),
        },

        # Mid-radios
        "inner":  {"J": _pt(J), "K": _pt(K), "L": _pt(L), "M": _pt(M)},
        "inner2": {"qA": _pt(qA), "qB": _pt(qB), "qC": _pt(qC), "qD": _pt(qD)},
    }


# Alias para compatibilidad con dataset.py
compute_matriz = build_matriz


# --- Verificacion ---
if __name__ == "__main__":
    casos = [
        ("Priscilla", 1,  11, 1990, 1,  11, 19, 4,  8),
        ("Elizabeth", 2,  11, 1981, 2,  11, 19, 5,  10),
        ("Isaac",     11, 2,  1994, 11, 2,  5,  18, 9),
        ("Michelle",  17, 4,  2002, 17, 4,  4,  7,  5),
    ]
    print("=== VERIFICACION - 4 casos oficiales ===\n")
    all_ok = True
    for nm, dia, mes, anio, eA, eB, eC, eD, eE in casos:
        r = build_matriz(dia, mes, anio)
        c = r["core"]
        ok = (c["A"]["n"]==eA and c["B"]["n"]==eB and c["C"]["n"]==eC
              and c["D"]["n"]==eD and c["E"]["n"]==eE)
        mark = "[OK]" if ok else "[!!]"
        print("%s %s: A=%d B=%d C=%d D=%d E=%d" % (
            mark, nm, c["A"]["n"], c["B"]["n"], c["C"]["n"], c["D"]["n"], c["E"]["n"]))
        if not ok:
            all_ok = False
    # Verificar claves de compatibilidad
    r = build_matriz(1, 11, 1990)
    assert r["core"]["G"]["nombre"], "G[nombre] falta"
    assert r["octagram"]["sky"]["nombre"], "sky[nombre] falta"
    print("\n[OK] TODOS CORRECTOS" if all_ok else "\n[!!] Hay errores")
