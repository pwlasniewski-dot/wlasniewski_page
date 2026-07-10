# -*- coding: utf-8 -*-
"""Pokaż nazwy folderów w Rodzice (źródło nazwisk) + ile twarzy dzieci w każdym."""
import os, pickle
from collections import defaultdict

OUT_DIR = r"G:\Torun 2026 A i B\POSORTOWANE"
CACHE = os.path.join(OUT_DIR, "face_cache.pkl")
with open(CACHE, "rb") as fh:
    data = pickle.load(fh)

by = defaultdict(lambda: [0, 0])
for r in data["rodzice"]:
    by[r["folder"]][0] += 1
    if 0 <= r["age"] <= 16:
        by[r["folder"]][1] += 1

print(f"Folderów w Rodzice: {len(by)}")
for name, (tot, kids) in sorted(by.items()):
    print(f"  {name:35s} twarzy={tot:3d}  (dzieci~{kids})")
