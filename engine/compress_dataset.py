#!/usr/bin/env python3
"""
compress-dataset.py
Reduce tamaño del dataset JSON sin perder información crítica
Ahorro: 30-40% del tamaño original
"""

import json

def comprimir_dataset(dataset):
    """
    Comprime un dataset IM Consulting:
    1. Elimina valores null/vacíos
    2. Redondea coordenadas astrológicas
    3. Trunca eventos biográficos
    4. Optimiza ubicación
    """
    
    dataset_limpio = {}
    for clave, valor in dataset.items():
        if valor is not None and valor != "" and valor != []:
            dataset_limpio[clave] = valor

    if "astro" in dataset_limpio and isinstance(dataset_limpio["astro"], dict):
        for planeta, posicion in dataset_limpio["astro"].items():
            if isinstance(posicion, dict):
                if "grados" in posicion and isinstance(posicion["grados"], float):
                    posicion["grados"] = round(posicion["grados"], 1)
                if "minutos" in posicion:
                    posicion["minutos"] = int(posicion["minutos"])
                if "segundos" in posicion:
                    posicion["segundos"] = int(posicion["segundos"])

    if "eventos_biograficos" in dataset_limpio:
        eventos_comprimidos = []
        for evento in dataset_limpio["eventos_biograficos"]:
            eventos_comprimidos.append({
                "año": evento.get("año"),
                "evento": evento.get("evento", "")[:60]
            })
        dataset_limpio["eventos_biograficos"] = eventos_comprimidos

    if "ubicacion" in dataset_limpio and isinstance(dataset_limpio["ubicacion"], dict):
        if "latitud" in dataset_limpio["ubicacion"]:
            dataset_limpio["ubicacion"]["latitud"] = round(
                dataset_limpio["ubicacion"]["latitud"], 2
            )
        if "longitud" in dataset_limpio["ubicacion"]:
            dataset_limpio["ubicacion"]["longitud"] = round(
                dataset_limpio["ubicacion"]["longitud"], 2
            )

    return dataset_limpio


def analizar_compresion(dataset_original, dataset_comprimido):
    """Reporta ahorro en bytes y porcentaje"""
    json_original = json.dumps(dataset_original)
    json_comprimido = json.dumps(dataset_comprimido)

    tamaño_antes = len(json_original.encode("utf-8"))
    tamaño_despues = len(json_comprimido.encode("utf-8"))
    ahorro = tamaño_antes - tamaño_despues
    porcentaje = (ahorro / tamaño_antes) * 100 if tamaño_antes > 0 else 0

    return {
        "tamaño_antes": tamaño_antes,
        "tamaño_despues": tamaño_despues,
        "ahorro_bytes": ahorro,
        "ahorro_porcentaje": round(porcentaje, 1),
    }


if __name__ == "__main__":
    dataset_ejemplo = {
        "nombre": "Isaac Moreno",
        "edad": 32,
        "astro": {
            "sol": {"grados": 21.7654321098, "signo": "Acuario"},
            "luna": {"grados": 4.123456789, "signo": "Escorpio"},
        },
        "eventos_biograficos": [
            {"año": 2015, "evento": "Cambio de carrera profesional después de 8 años en startup"},
            {"año": 2019, "evento": "Viaje a Europa"},
        ],
        "ubicacion": {"latitud": 29.0469, "longitud": -110.9659},
        "nota": None,
    }

    comprimido = comprimir_dataset(dataset_ejemplo)
    stats = analizar_compresion(dataset_ejemplo, comprimido)

    print("\n📊 COMPRESIÓN DE DATASET")
    print(f"Antes: {stats['tamaño_antes']} bytes")
    print(f"Después: {stats['tamaño_despues']} bytes")
    print(f"Ahorro: {stats['ahorro_bytes']} bytes ({stats['ahorro_porcentaje']}%)")
    print(f"\nDataset original:\n{json.dumps(dataset_ejemplo, indent=2)}")
    print(f"\nDataset comprimido:\n{json.dumps(comprimido, indent=2)}")
