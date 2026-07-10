# -*- coding: utf-8 -*-
"""
Automatyczne znalezienie 2 zdjęć KLASOWYCH.

Idea: na zdjęciu klasowym prawie każda twarz to dziecko komunijne, a dzieci
występują w WIELU kadrach (duże klastry). Na zdjęciu rodzinnym większość osób
pojawia się tylko raz (małe klastry). Więc dla każdego zdjęcia liczymy, ilu jego
uczestników należy do dużych klastrów — zdjęcia klasowe wychodzą na wierzch.
"""
import os, pickle
from collections import defaultdict
import numpy as np

OUT_DIR = r"G:\Torun 2026 A i B\POSORTOWANE"
CACHE = os.path.join(OUT_DIR, "face_cache.pkl")
EPS = 0.55
BIG = 8  # klaster "duży" (osoba fotografowana wielokrotnie = dziecko)

with open(CACHE, "rb") as fh:
    data = pickle.load(fh)
photos = data["photos"]
embs = np.stack([r["emb"] for r in photos])

from sklearn.cluster import DBSCAN
d = 1.0 - (embs @ embs.T)
np.clip(d, 0, 2, out=d); np.fill_diagonal(d, 0.0)
labels = DBSCAN(eps=EPS, min_samples=2, metric="precomputed").fit_predict(d)

size = defaultdict(int)
for l in labels:
    size[l] += 1

by_photo = defaultdict(list)
for i, r in enumerate(photos):
    by_photo[r["path"]].append(i)

rows = []
for path, idxs in by_photo.items():
    n = len(idxs)
    if not (17 <= n <= 27):
        continue
    big = sum(1 for i in idxs if labels[i] != -1 and size[labels[i]] >= BIG)
    rows.append((round(big / n, 2), big, n, path))

# sortuj wg udziału dzieci, potem liczby dzieci
rows.sort(reverse=True)
print(f"POJEDYNCZA KLASA — kandydaci (17-27 twarzy, wysoki % dzieci):")
print(f"{'%':>5} {'DZIECI':>6} {'TWARZE':>6}  PLIK")
for frac, big, n, path in rows[:30]:
    print(f"{frac:5.2f} {big:6d} {n:6d}  {os.path.basename(path)}")
