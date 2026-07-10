# -*- coding: utf-8 -*-
"""
Etap 2 (v2, BEZ WIEKU): KLASTROWANIE + NAZWISKA + KLASY A/B + PLAN.

Model wieku insightface zawyża wiek dzieci, więc NIE filtrujemy po wieku.
Zamiast tego "dziecko komunijne" definiują ZDJĘCIA KLASOWE A/B:
  - twarz jest komunijnym dzieckiem, jeśli pasuje do kogoś ze zdjęcia klasowego,
  - klasa = to zdjęcie klasowe (A/B), do którego pasuje lepiej,
  - dziecko danej rodziny (folder Rodzice) = ta twarz z folderu, która najlepiej
    pasuje do zdjęcia klasowego (a nie "najczęstsza", bo częsty bywa i rodzic).

Uruchom:
  python scripts/face_sort_cluster2.py
"""
import os
import re
import json
import time
import pickle
from collections import defaultdict

import numpy as np

# ---------- KONFIGURACJA ----------
OUT_DIR = r"G:\Torun 2026 A i B\POSORTOWANE"
CACHE_FILE = os.path.join(OUT_DIR, "face_cache.pkl")

# NAZWY PLIKÓW ZDJĘĆ KLASOWYCH (uzupełnij! same nazwy plików):
GROUP_A_FILE = "Pierwsza Komunia Święta w Toruniu417.jpg"   # klasa A (do potwierdzenia)
GROUP_B_FILE = ""                                           # klasa B (do ustalenia)

COMMUNICANT_SIM = 0.45   # min. cosinus do zdjęcia klasowego, by uznać za dziecko komunijne
NAME_THRESH = 0.42       # min. cosinus, by przypisać nazwisko z folderu Rodzice
DBSCAN_EPS = 0.55        # odległość cosinus (1-sim) dla klastrowania
DBSCAN_MIN = 2
SKIP_FOLDERS = {"Rodzice"}  # luźne pliki w korzeniu Rodzice (bez nazwiska)
# ----------------------------------


def log(*a):
    print(*a, flush=True)


def cos(a, b):
    return float(np.dot(a, b))


def load_cache():
    with open(CACHE_FILE, "rb") as fh:
        return pickle.load(fh)


def cluster_embeddings(embs, eps, min_samples):
    from sklearn.cluster import DBSCAN
    if len(embs) == 0:
        return np.array([])
    d = 1.0 - (embs @ embs.T)
    np.clip(d, 0, 2, out=d)
    np.fill_diagonal(d, 0.0)
    return DBSCAN(eps=eps, min_samples=min_samples, metric="precomputed").fit_predict(d)


def group_faces(photos, filename):
    if not filename:
        return []
    return [r["emb"] for r in photos if os.path.basename(r["path"]).lower() == filename.lower()]


def best_sim(emb, ref_list):
    if not ref_list:
        return -1.0
    return max(cos(emb, e) for e in ref_list)


def nice_name(folder):
    s = re.sub(r"-?wybrane-?zdjecia$", "", folder)
    s = s.replace("-", " ").strip()
    return s.title() if s else folder


def build_name_refs(rodzice, group_a, group_b):
    """Dla każdej rodziny: dziecko = twarz najlepiej pasująca do zdjęcia klasowego."""
    by_name = defaultdict(list)
    for r in rodzice:
        if r["folder"] in SKIP_FOLDERS:
            continue
        by_name[r["folder"]].append(r)

    refs = {}
    log("\n=== Wzorce dzieci z folderu Rodzice (bez wieku, kotwica = zdjęcie klasowe) ===")
    for folder, recs in sorted(by_name.items()):
        embs = np.stack([r["emb"] for r in recs])
        labels = cluster_embeddings(embs, DBSCAN_EPS, 1)
        best_score, best_centroid, best_n = -1.0, None, 0
        for lab in sorted(set(labels)):
            idx = np.where(labels == lab)[0]
            c = embs[idx].mean(axis=0)
            c = c / (np.linalg.norm(c) + 1e-9)
            score = max(best_sim(c, group_a), best_sim(c, group_b))
            if score > best_score:
                best_score, best_centroid, best_n = score, c, len(idx)
        refs[nice_name(folder)] = best_centroid
        log(f"  {nice_name(folder):28s} klaster={best_n:3d} kadr. | sim_klasa={best_score:.2f}")
    return refs


def main():
    data = load_cache()
    photos = data["photos"]
    rodzice = data["rodzice"]
    photos_dir = data["photos_dir"]

    group_a = group_faces(photos, GROUP_A_FILE)
    group_b = group_faces(photos, GROUP_B_FILE)
    log(f"Twarze na zdjęciu klasowym A ({GROUP_A_FILE or '—'}): {len(group_a)}")
    log(f"Twarze na zdjęciu klasowym B ({GROUP_B_FILE or '—'}): {len(group_b)}")
    if not group_a and not group_b:
        log("BŁĄD: ustaw GROUP_A_FILE i/lub GROUP_B_FILE — bez nich nie rozpoznam dzieci.")
        return

    name_refs = build_name_refs(rodzice, group_a, group_b)

    embs = np.stack([r["emb"] for r in photos])
    log(f"\nKlastrowanie {len(embs)} twarzy...")
    labels = cluster_embeddings(embs, DBSCAN_EPS, DBSCAN_MIN)
    uniq = sorted(set(labels) - {-1})
    log(f"Klastrów: {len(uniq)}, szum: {int(np.sum(labels==-1))}")

    clusters = {}
    for lab in uniq:
        idx = np.where(labels == lab)[0]
        c = embs[idx].mean(axis=0)
        c = c / (np.linalg.norm(c) + 1e-9)
        clusters[lab] = {"centroid": c, "face_idx": idx.tolist()}

    assign = {}
    counters = defaultdict(int)
    for lab, info in clusters.items():
        c = info["centroid"]
        sa, sb = best_sim(c, group_a), best_sim(c, group_b)
        if max(sa, sb) < COMMUNICANT_SIM:
            continue
        klasa = "A" if sa >= sb else "B"
        best_name, best_val = None, -1.0
        for name, ref in name_refs.items():
            v = cos(c, ref)
            if v > best_val:
                best_name, best_val = name, v
        if best_val >= NAME_THRESH:
            assign[lab] = {"folder": best_name, "kind": "nazwisko", "klasa": klasa, "score": round(best_val, 3)}
        else:
            counters[klasa] += 1
            assign[lab] = {"folder": f"Rodzic {counters[klasa]:02d} Klasa {klasa}", "kind": "klasa", "klasa": klasa, "score": round(max(sa, sb), 3)}

    log(f"\nKomunijnych klastrów (dzieci): {len(assign)}")

    def face_entry(i):
        r = photos[i]
        return {"fid": int(i), "path": r["path"], "bbox": r["bbox"], "det": round(float(r["det_score"]), 3)}

    plan = {"photos_dir": photos_dir, "out_dir": OUT_DIR, "generated": time.strftime("%Y-%m-%d %H:%M:%S"), "clusters": []}
    for lab, a in sorted(assign.items(), key=lambda kv: kv[1]["folder"]):
        plan["clusters"].append({
            "id": int(lab), "folder": a["folder"], "kind": a["kind"], "klasa": a["klasa"],
            "score": a["score"], "faces": [face_entry(i) for i in clusters[lab]["face_idx"]],
        })
    with open(os.path.join(OUT_DIR, "plan.json"), "w", encoding="utf-8") as fh:
        json.dump(plan, fh, ensure_ascii=False, indent=1)

    log("\n=== PRZYPISANIE ===")
    for c in plan["clusters"]:
        log(f"  {c['folder']:26s} ({c['kind']}, kl.{c['klasa']}, {c['score']}) — kadrów: {len(c['faces'])}")
    log(f"\nPlan zapisany: {os.path.join(OUT_DIR, 'plan.json')} (klastrów: {len(plan['clusters'])})")
    log("Teraz uruchom panel:  python scripts/face_panel.py")


if __name__ == "__main__":
    main()
