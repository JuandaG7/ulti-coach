# Verifica que sw.js incluya todos los archivos de la app (si falta uno, la app no abre sin internet).
# Uso: python3 tools/check-sw.py
import os
import re
import sys

root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sw = open(os.path.join(root, "sw.js")).read()
shell = {x[2:] for x in re.findall(r'"(\./[^"]*)"', sw) if x != "./"}
files = set()
for d, _, fs in os.walk(root):
    rel = os.path.relpath(d, root)
    if rel.split(os.sep)[0] in (".git", "tools"):
        continue
    for f in fs:
        p = os.path.relpath(os.path.join(d, f), root)
        if p.endswith((".js", ".css", ".html", ".json", ".svg", ".png")) and p != "sw.js" and not p.startswith("_"):
            files.add(p)

missing, extra = sorted(files - shell), sorted(shell - files)
if missing or extra:
    print("Faltan en sw.js:", missing)
    print("Sobran en sw.js:", extra)
    sys.exit(1)
print(f"OK: sw.js incluye los {len(files)} archivos")
