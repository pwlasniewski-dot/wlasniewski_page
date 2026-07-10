# -*- coding: utf-8 -*-
"""Kontaktówka kandydatów na zdjęcia KLASOWE (16-34 twarzy) — jeden obraz z numerami."""
import os, pickle, re
from collections import Counter
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = r"G:\Torun 2026 A i B\POSORTOWANE"
CACHE = os.path.join(OUT_DIR, "face_cache.pkl")
LO, HI = 18, 34
TILE = 240
COLS = 8
OUTFILE = os.path.join(OUT_DIR, "kandydaci_klasowe.jpg")

with open(CACHE, "rb") as fh:
    data = pickle.load(fh)
c = Counter(r["path"] for r in data["photos"])
rows = sorted([(n, p) for p, n in c.items() if LO <= n <= HI], reverse=True)

def num(p):
    m = re.search(r"(\d+)\.jpg$", os.path.basename(p), re.I)
    return m.group(1) if m else os.path.basename(p)

n = len(rows)
r_count = (n + COLS - 1) // COLS
sheet = Image.new("RGB", (COLS * TILE, r_count * TILE), (20, 20, 24))
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("arialbd.ttf", 26)
except Exception:
    font = ImageFont.load_default()

for i, (faces, path) in enumerate(rows):
    r, col = divmod(i, COLS)
    x, y = col * TILE, r * TILE
    try:
        im = Image.open(path).convert("RGB")
        im.thumbnail((TILE - 8, TILE - 34))
        sheet.paste(im, (x + 4, y + 30))
    except Exception:
        pass
    label = f"#{num(path)}  ({faces}tw)"
    draw.rectangle([x, y, x + TILE, y + 28], fill=(0, 0, 0))
    draw.text((x + 6, y + 3), label, fill=(255, 230, 120), font=font)

sheet.save(OUTFILE, quality=85)
print("Zapisano:", OUTFILE, f"({n} kandydatów)")
