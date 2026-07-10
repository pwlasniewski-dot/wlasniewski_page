# -*- coding: utf-8 -*-
"""
Sortowanie zdjęć komunijnych po twarzach dzieci → foldery.

Etap 1 (ten plik): DETEKCJA + EMBEDDINGI + CACHE.
  - skanuje folder ze zdjęciami i folder "Rodzice",
  - dla każdego zdjęcia wykrywa twarze (bbox, embedding, wiek, płeć),
  - zapisuje wszystko do face_cache.pkl (żeby kolejne uruchomienia były szybkie).

Etap 2 (face_sort_cluster.py): przypisanie nazwisk + klas A/B + budowa folderów.

Wymagania (instalacja raz):
  pip install insightface onnxruntime opencv-python numpy scikit-learn pillow tqdm

Model buffalo_l pobierze się automatycznie przy pierwszym uruchomieniu (~300 MB).
"""
import os
import sys
import glob
import pickle
import time

import numpy as np

# ---------------- KONFIGURACJA ----------------
PHOTOS_DIR = r"G:\Torun 2026 A i B\Obrobione LRC 20260614\Pierwsza Komunia Swięta Szkoła Seslezjańska Klasa A i B 30.05.2026"
RODZICE_DIR = r"G:\Torun 2026 A i B\Rodzice"
OUT_DIR = r"G:\Torun 2026 A i B\POSORTOWANE"
CACHE_FILE = os.path.join(OUT_DIR, "face_cache.pkl")

DET_SIZE = 1024          # większe = lepsza detekcja małych twarzy na grupowych, wolniej
MIN_FACE_PX = 24         # ignoruj twarze mniejsze niż tyle px (szum)
IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")
# ----------------------------------------------


def log(*a):
    print(*a, flush=True)


def list_images(root):
    out = []
    for ext in IMG_EXTS:
        out += glob.glob(os.path.join(root, "**", "*" + ext), recursive=True)
        out += glob.glob(os.path.join(root, "**", "*" + ext.upper()), recursive=True)
    # deduplikacja (windows case-insensitive)
    seen, uniq = set(), []
    for p in out:
        k = os.path.normcase(os.path.abspath(p))
        if k not in seen:
            seen.add(k)
            uniq.append(p)
    return sorted(uniq)


def load_model():
    from insightface.app import FaceAnalysis
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=-1, det_size=(DET_SIZE, DET_SIZE))
    return app


def read_image(path):
    """Wczytuje obraz w BGR (jak OpenCV), odporne na polskie znaki w ścieżce."""
    import cv2
    try:
        data = np.fromfile(path, dtype=np.uint8)
        img = cv2.imdecode(data, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        log("  ! nie wczytano:", path, e)
        return None


def process_folder(app, root, tag):
    imgs = list_images(root)
    log(f"\n[{tag}] folder: {root}")
    log(f"[{tag}] plików graficznych: {len(imgs)}")
    records = []
    t0 = time.time()
    for i, path in enumerate(imgs, 1):
        img = read_image(path)
        if img is None:
            continue
        faces = app.get(img)
        rel = os.path.relpath(path, root)
        for f in faces:
            x1, y1, x2, y2 = f.bbox.astype(int)
            w, h = x2 - x1, y2 - y1
            if min(w, h) < MIN_FACE_PX:
                continue
            emb = f.normed_embedding.astype(np.float32)  # znormalizowany (do cosinus)
            records.append({
                "source": tag,           # "photos" lub "rodzice"
                "path": path,
                "rel": rel,
                "folder": os.path.basename(os.path.dirname(path)),
                "bbox": [int(x1), int(y1), int(x2), int(y2)],
                "det_score": float(getattr(f, "det_score", 0.0)),
                "age": int(getattr(f, "age", -1)),
                "gender": int(getattr(f, "gender", -1)),  # 0=K,1=M w insightface
                "emb": emb,
            })
        if i % 25 == 0 or i == len(imgs):
            dt = time.time() - t0
            log(f"[{tag}] {i}/{len(imgs)}  twarzy: {len(records)}  ({dt:.0f}s)")
    return records


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    for d, name in [(PHOTOS_DIR, "PHOTOS_DIR"), (RODZICE_DIR, "RODZICE_DIR")]:
        if not os.path.isdir(d):
            log(f"BŁĄD: nie istnieje {name}: {d}")
            sys.exit(1)

    log("Ładowanie modelu insightface (buffalo_l)... pierwszy raz pobiera ~300MB")
    app = load_model()
    log("Model gotowy.")

    rec_photos = process_folder(app, PHOTOS_DIR, "photos")
    rec_rodzice = process_folder(app, RODZICE_DIR, "rodzice")

    data = {
        "photos": rec_photos,
        "rodzice": rec_rodzice,
        "photos_dir": PHOTOS_DIR,
        "rodzice_dir": RODZICE_DIR,
        "det_size": DET_SIZE,
    }
    with open(CACHE_FILE, "wb") as fh:
        pickle.dump(data, fh)

    log("\n==== PODSUMOWANIE ETAPU 1 ====")
    log(f"Twarze w zdjęciach głównych: {len(rec_photos)}")
    log(f"Twarze w folderze Rodzice:   {len(rec_rodzice)}")
    log(f"Cache zapisany: {CACHE_FILE}")
    # kandydaci na zdjęcia grupowe = najwięcej twarzy
    from collections import Counter
    c = Counter(r["path"] for r in rec_photos)
    log("\nKandydaci na zdjęcia GRUPOWE (najwięcej twarzy):")
    for path, n in c.most_common(8):
        log(f"  {n:3d} twarzy  {os.path.basename(path)}")
    log("\nZ tej listy wskaż który plik to KLASA A, a który KLASA B (do etapu 2).")


if __name__ == "__main__":
    main()
