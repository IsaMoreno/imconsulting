"""
compute_dataset.py — Netlify Python Function
Recibe datos del cliente, calcula carta natal + matriz + numerología.
Llamada internamente desde webhook.js via fetch.
"""
import json
import sys
import os

# Añadir engine/ al path (disponible en /var/task/engine/ en Netlify)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'engine'))

from dataset import build_dataset


def handler(event, context):
    try:
        body = json.loads(event.get('body') or '{}')

        nombre  = body.get('nombre', '')
        day     = int(body.get('day',    1))
        month   = int(body.get('month',  1))
        year    = int(body.get('year',   2000))
        hour    = int(body.get('hour',   0))
        minute  = int(body.get('minute', 0))
        lat     = float(body.get('lat',  29.07))
        lng     = float(body.get('lng',  -110.96))
        tz_str  = body.get('tz',     'America/Hermosillo')
        ciudad  = body.get('ciudad', '')
        pais    = body.get('pais',   '')

        dataset = build_dataset(
            name=nombre,
            day=day, month=month, year=year,
            hour=hour, minute=minute,
            lat=lat, lng=lng, tz_str=tz_str,
            ciudad=ciudad, pais=pais,
            comprimir=False,
        )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(dataset, ensure_ascii=False),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
        }
