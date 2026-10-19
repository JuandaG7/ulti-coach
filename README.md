# Ulti Coach

App web personal para analizar técnica de ultimate con videos del celular.
Todo corre en el navegador: los videos no se suben a ningún servidor.

## Correrla en la Mac

```bash
python3 -m http.server 8765 --directory ulti-coach
```

Luego abre http://localhost:8765

## Cómo grabar el forehand

- Cámara **de lado** (perpendicular a la dirección del lanzamiento), a la altura de la cadera.
- Todo el cuerpo en el cuadro, de pies a cabeza, con un poco de margen.
- Celular quieto (trípode o apoyado).
- Clips cortos: 2–5 segundos por lanzamiento.

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html`, `style.css` | Estructura y diseño |
| `app.js` | Navegación entre pestañas |
| `views/` | Pantallas: Inicio, Cuerpo, Pruebas, Video y la hoja de detalle |
| `data/tests.js` | Pruebas físicas, protocolos y metas (base → élite). **Ajusta aquí las metas** |
| `data/muscles.js` | Músculos, importancia en ultimate, pruebas que los califican y ejercicios |
| `data/body-map.js` | Polígonos del mapa corporal (react-body-highlighter, MIT) |
| `scoring.js` | Cálculo de puntajes y prioridades |
| `store.js` | Guarda las mediciones en el dispositivo |
| `pose.js`, `metrics.js` | Análisis de video con MediaPipe |
| `sw.js`, `manifest.json` | Permiten instalarla en el iPhone como app |

## Cómo se calculan los puntajes

- Cada prueba: 0 = nivel base, 100 = nivel élite (lineal, con tope en 0 y 100).
- Cada músculo: promedio ponderado de las pruebas que lo miden (solo las que tienen datos).
- Cada categoría y el Ulti Score: promedio de sus partes.
- "Tu foco": importancia del músculo en ultimate × lo que le falta para élite.
