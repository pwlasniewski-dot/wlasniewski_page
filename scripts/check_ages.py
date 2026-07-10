# -*- coding: utf-8 -*-
"""Rozkład wieku wykrytych twarzy — sprawdzenie czy age nadaje się do filtrowania dzieci."""
import os, pickle
from collections import Counter

OUT_DIR = r"G:\Torun 2026 A i B\POSORTOWANE"
CACHE = os.path.join(OUT_DIR, "face_cache.pkl")
with open(CACHE, "rb") as fh:
    data = pickle.load(fh)

def hist(recs, tag):
    ages = [r["age"] for r in recs]
    print(f"\n[{tag}] twarzy={len(recs)}")
    bins = Counter()
    for a in ages:
        bins[(a // 5) * 5] += 1
    for b in sorted(bins):
        print(f"  {b:3d}-{b+4:<3d}: {bins[b]:5d}  {'#'*(bins[b]//30)}")
    n_le12 = sum(1 for a in ages if a <= 12)
    n_le16 = sum(1 for a in ages if a <= 16)
    print(f"  <=12: {n_le12} | <=16: {n_le16}")

hist(data["photos"], "photos")
# jedna rodzina
from collections import defaultdict
byf = defaultdict(list)
for r in data["rodzice"]:
    byf[r["folder"]].append(r)
for name in ["magdalena-walenciak-wybrane-zdjecia", "marta-jasinska-wybrane-zdjecia"]:
    if name in byf:
        hist(byf[name], name)
