# -*- coding: utf-8 -*-
"""
Etap 2: KLASTROWANIE + NAZWISKA + KLASY A/B + FOLDERY.

Czyta face_cache.pkl (z etapu 1) i:
  1. buduje wzorzec twarzy DZIECKA dla każdego nazwiska z folderu Rodzice,
  2. klastruje twarze dzieci ze zdjęć głównych (1 klaster = 1 dziecko),
  3. dopasowuje klastry do nazwisk (jeśli podobne) — reszta bez nazwiska,
  4. przypisuje klastry bez nazwiska do KLASY A lub B (wg zdjęć grupowych),
  5. kopiuje zdjęcia do folderów: <Nazwisko>/  oraz  Rodzic NN Klasa A/ , Rodzic NN Klasa B/,
  6. generuje review.html do weryfikacji.

Uruchom PO etapie 1:
  python scripts/face_sort_cluster.py
"""
import os
import json
import time
import pickle
import shutil
import html
from collections import defaultdict, Counter

import numpy as np

# ---------- KONFIGURACJA ----------
OUT_DIR = r"G:\Torun 2026 A i B\POSORTOWANE"
CACHE_FILE = os.path.join(OUT_DIR, "face_cache.pkl")

# NAZWY PLIKÓW ZDJĘĆ GRUPOWYCH (uzupełnij po etapie 1 z listy kandydatów!):
GROUP_A_FILE = ""   # np. "DSC_1234.jpg"  -> klasa A (żółte A)
GROUP_B_FILE = ""   # np. "DSC_5678.jpg"  -> klasa B (czerwony znacznik)

CHILD_MAX_AGE = 16      # twarze starsze = dorośli (księża/rodzice/nauczyciele) -> pomijamy przy klastrowaniu dzieci
NAME_THRESH = 0.40      # min. cosinus, by uznać klaster za znane nazwisko z Rodzice
CLASS_MIN_SIM = 0.28    # min. cosinus do pewnego przypisania klasy
DBSCAN_EPS = 0.50       # odległość cosinus (1-sim); mniejsze = ciaśniejsze klastry
DBSCAN_MIN = 2
COPY_FILES = True       # False = tylko raport, bez kopiowania
# ----------------------------------


def log(*a):
    print(*a, flush=True)


def load_cache():
    with open(CACHE_FILE, "rb") as fh:
        return pickle.load(fh)


def cos(a, b):
    return float(np.dot(a, b))  # embeddingi już znormalizowane


def build_name_refs(rodzice):
    """Dla każdego folderu-nazwiska w 'Rodzice' wyznacz wzorzec twarzy DZIECKA."""
    by_name = defaultdict(list)
    for r in rodzice:
        by_name[r["folder"]].append(r)

    refs = {}
    log("\n=== Wzorce dzieci z folderu Rodzice ===")
    for name, recs in sorted(by_name.items()):
        kids = [r for r in recs if 0 <= r["age"] <= CHILD_MAX_AGE]
        pool = kids if kids else recs
        embs = np.stack([r["emb"] for r in pool])
        if len(embs) == 1:
            centroid = embs[0]
            n = 1
        else:
            # największy spójny klaster = dziecko powtarzające się na zdjęciach rodziny
            from sklearn.cluster import DBSCAN
            d = 1.0 - (embs @ embs.T)
            np.fill_diagonal(d, 0.0)
            labels = DBSCAN(eps=DBSCAN_EPS, min_samples=1, metric="precomputed").fit_predict(d)
            best = Counter(labels).most_common(1)[0][0]
            sel = embs[labels == best]
            centroid = sel.mean(axis=0)
            centroid = centroid / (np.linalg.norm(centroid) + 1e-9)
            n = len(sel)
        refs[name] = centroid
        log(f"  {name:30s} twarzy={len(recs):3d} dziecko z {n} kadrów")
    return refs


def group_child_faces(photos, filename):
    """Embeddingi twarzy dzieci na wskazanym zdjęciu grupowym."""
    if not filename:
        return []
    out = []
    for r in photos:
        if os.path.basename(r["path"]).lower() == filename.lower():
            if 0 <= r["age"] <= CHILD_MAX_AGE:
                out.append(r["emb"])
    return out


def best_sim(emb, ref_list):
    if not ref_list:
        return -1.0
    return max(cos(emb, e) for e in ref_list)


def main():
    data = load_cache()
    photos = data["photos"]
    rodzice = data["rodzice"]
    photos_dir = data["photos_dir"]

    # 1) wzorce nazwisk
    name_refs = build_name_refs(rodzice)

    # 2) twarze dzieci ze zdjęć głównych
    child_faces = [r for r in photos if 0 <= r["age"] <= CHILD_MAX_AGE]
    log(f"\nTwarzy dzieci do klastrowania: {len(child_faces)} (z {len(photos)} wszystkich)")
    if not child_faces:
        log("Brak twarzy dzieci — sprawdź CHILD_MAX_AGE.")
        return
    embs = np.stack([r["emb"] for r in child_faces])

    from sklearn.cluster import DBSCAN
    dist = 1.0 - (embs @ embs.T)
    np.clip(dist, 0, 2, out=dist)
    np.fill_diagonal(dist, 0.0)
    labels = DBSCAN(eps=DBSCAN_EPS, min_samples=DBSCAN_MIN, metric="precomputed").fit_predict(dist)
    n_clusters = len(set(labels) - {-1})
    log(f"Znaleziono klastrów (dzieci): {n_clusters}, szumu (nieprzypisane): {int(np.sum(labels==-1))}")

    # centroidy klastrów
    clusters = {}
    for lab in sorted(set(labels) - {-1}):
        idx = np.where(labels == lab)[0]
        c = embs[idx].mean(axis=0)
        c = c / (np.linalg.norm(c) + 1e-9)
        clusters[lab] = {"centroid": c, "face_idx": idx.tolist()}

    # 3) dopasowanie nazwisk
    group_a = group_child_faces(photos, GROUP_A_FILE)
    group_b = group_child_faces(photos, GROUP_B_FILE)
    if GROUP_A_FILE or GROUP_B_FILE:
        log(f"\nTwarze na grupowym A: {len(group_a)} | B: {len(group_b)}")
    else:
        log("\nUWAGA: nie ustawiono GROUP_A_FILE / GROUP_B_FILE — podział na klasy pominięty.")

    assign = {}   # lab -> nazwa folderu
    ridx_a = ridx_b = 0
    unknown_labels = []
    for lab, info in clusters.items():
        c = info["centroid"]
        # najlepsze nazwisko
        best_name, best_val = None, -1.0
        for name, ref in name_refs.items():
            v = cos(c, ref)
            if v > best_val:
                best_name, best_val = name, v
        if best_val >= NAME_THRESH:
            assign[lab] = {"folder": best_name, "kind": "nazwisko", "score": best_val}
        else:
            unknown_labels.append(lab)

    # 4) klasy A/B dla nieznanych
    for lab in unknown_labels:
        c = clusters[lab]["centroid"]
        sa, sb = best_sim(c, group_a), best_sim(c, group_b)
        if max(sa, sb) < CLASS_MIN_SIM:
            klasa = "NIEPEWNE"
        else:
            klasa = "A" if sa >= sb else "B"
        assign[lab] = {"folder": None, "kind": "klasa", "klasa": klasa, "score": max(sa, sb)}

    # numeracja Rodzic NN w obrębie klasy
    counters = defaultdict(int)
    for lab in unknown_labels:
        klasa = assign[lab]["klasa"]
        counters[klasa] += 1
        assign[lab]["folder"] = f"Rodzic {counters[klasa]:02d} Klasa {klasa}"

    # mapowanie: zdjęcie -> zbiór folderów (klastry obecne na zdjęciu)
    photo_to_folders = defaultdict(set)
    face_to_lab = {}
    for i, lab in enumerate(labels):
        if lab == -1:
            continue
        face_to_lab[i] = lab
    for i, r in enumerate(child_faces):
        lab = labels[i]
        if lab == -1:
            continue
        photo_to_folders[r["path"]].add(assign[lab]["folder"])

    # 5) kopiowanie
    log("\n=== PRZYPISANIE ===")
    for lab, a in sorted(assign.items(), key=lambda kv: kv[1]["folder"]):
        nfaces = len(clusters[lab]["face_idx"])
        log(f"  {a['folder']:26s} ({a['kind']}, score={a['score']:.2f}) — kadrów z tym dzieckiem: {nfaces}")

    # 5a) PLAN.JSON dla panelu (do inteligentnej korekty przed eksportem)
    def face_entry(i):
        r = child_faces[i]
        return {"fid": int(i), "path": r["path"], "bbox": r["bbox"], "age": int(r["age"]), "det": round(float(r["det_score"]), 3)}

    plan = {"photos_dir": photos_dir, "out_dir": OUT_DIR, "generated": time.strftime("%Y-%m-%d %H:%M:%S"), "clusters": []}
    for lab, a in sorted(assign.items(), key=lambda kv: kv[1]["folder"]):
        plan["clusters"].append({
            "id": int(lab),
            "folder": a["folder"],
            "kind": a["kind"],
            "klasa": a.get("klasa"),
            "score": round(float(a["score"]), 3),
            "faces": [face_entry(i) for i in clusters[lab]["face_idx"]],
        })
    noise_idx = [i for i, l in enumerate(labels) if l == -1]
    if noise_idx:
        plan["clusters"].append({
            "id": -1, "folder": "SZUM (nieprzypisane)", "kind": "szum", "klasa": None, "score": 0.0,
            "faces": [face_entry(i) for i in noise_idx],
        })
    with open(os.path.join(OUT_DIR, "plan.json"), "w", encoding="utf-8") as fh:
        json.dump(plan, fh, ensure_ascii=False, indent=1)
    log(f"\nPlan zapisany: {os.path.join(OUT_DIR, 'plan.json')} (klastrów: {len(plan['clusters'])})")

    if COPY_FILES:
        n_copied = 0
        for path, folders in photo_to_folders.items():
            for folder in folders:
                dst_dir = os.path.join(OUT_DIR, folder)
                os.makedirs(dst_dir, exist_ok=True)
                dst = os.path.join(dst_dir, os.path.basename(path))
                if not os.path.exists(dst):
                    shutil.copy2(path, dst)
                    n_copied += 1
        log(f"\nSkopiowano plików (z powtórzeniami w wielu folderach): {n_copied}")

    # 6) raport HTML
    write_report(clusters, assign, labels, child_faces, photo_to_folders)
    log(f"\nRaport: {os.path.join(OUT_DIR, 'review.html')}")
    log("GOTOWE.")


def write_report(clusters, assign, labels, child_faces, photo_to_folders):
    # grupuj zdjęcia per folder
    folder_photos = defaultdict(set)
    for path, folders in photo_to_folders.items():
        for f in folders:
            folder_photos[f].add(path)

    parts = ["<!doctype html><meta charset='utf-8'><title>Przegląd sortowania</title>",
             "<style>body{font-family:sans-serif;background:#111;color:#eee;margin:16px}",
             "h2{border-bottom:1px solid #444;margin-top:32px}",
             ".grid{display:flex;flex-wrap:wrap;gap:6px}",
             ".grid img{height:120px;border:1px solid #333;border-radius:4px}",
             ".tag{color:#8cf}</style>"]
    parts.append(f"<h1>Przegląd — {len(folder_photos)} folderów</h1>")
    for folder in sorted(folder_photos.keys()):
        imgs = sorted(folder_photos[folder])
        parts.append(f"<h2>{html.escape(folder)} <span class='tag'>({len(imgs)} zdjęć)</span></h2>")
        parts.append("<div class='grid'>")
        for p in imgs:
            uri = "file:///" + p.replace("\\", "/")
            parts.append(f"<img src=\"{html.escape(uri)}\" title=\"{html.escape(os.path.basename(p))}\">")
        parts.append("</div>")
    with open(os.path.join(OUT_DIR, "review.html"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(parts))


if __name__ == "__main__":
    main()
