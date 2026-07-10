# -*- coding: utf-8 -*-
"""Mini-kontaktówka wskazanych plików (do znalezienia drugiej klasy)."""
import os
from PIL import Image, ImageDraw, ImageFont

PHOTOS = r"G:\Torun 2026 A i B\Obrobione LRC 20260614\Pierwsza Komunia Swięta Szkoła Seslezjańska Klasa A i B 30.05.2026"
OUT = r"G:\Torun 2026 A i B\POSORTOWANE\mini_kontakt.jpg"
NUMS = ["378", "268", "269", "216", "242", "222", "212", "244", "279", "300", "251", "249"]
TILE = 430
COLS = 4

def fname(n):
    return os.path.join(PHOTOS, f"Pierwsza Komunia Święta w Toruniu{n}.jpg")

r_count = (len(NUMS) + COLS - 1) // COLS
sheet = Image.new("RGB", (COLS * TILE, r_count * TILE), (18, 18, 22))
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("arialbd.ttf", 34)
except Exception:
    font = ImageFont.load_default()
for i, n in enumerate(NUMS):
    r, c = divmod(i, COLS)
    x, y = c * TILE, r * TILE
    try:
        im = Image.open(fname(n)).convert("RGB")
        im.thumbnail((TILE - 8, TILE - 40))
        sheet.paste(im, (x + 4, y + 34))
    except Exception as e:
        print("err", n, e)
    draw.rectangle([x, y, x + TILE, y + 32], fill=(0, 0, 0))
    draw.text((x + 6, y + 3), f"#{n}", fill=(255, 220, 90), font=font)
sheet.save(OUT, quality=88)
print("Zapisano:", OUT)
