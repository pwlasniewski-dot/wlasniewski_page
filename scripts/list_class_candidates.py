# -*- coding: utf-8 -*-
"""Lista zdjęć wg liczby twarzy w zadanym przedziale — do znalezienia zdjęć KLASOWYCH A/B."""
import os, pickle
from collections import Counter

OUT_DIR = r"G:\Torun 2026 A i B\POSORTOWANE"
CACHE = os.path.join(OUT_DIR, "face_cache.pkl")
LO, HI = 16, 34

with open(CACHE, "rb") as fh:
    data = pickle.load(fh)
c = Counter(r["path"] for r in data["photos"])
rows = [(n, p) for p, n in c.items() if LO <= n <= HI]
rows.sort(reverse=True)
print(f"Zdjęcia z {LO}-{HI} twarzami (kandydaci na zdjęcia KLASOWE): {len(rows)}")
for n, p in rows:
    print(f"  {n:3d}  {os.path.basename(p)}")
