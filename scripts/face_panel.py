# -*- coding: utf-8 -*-
"""
Panel korekty i eksportu (lokalny, w przeglądarce).

Czyta plan.json (z etapu 2) i pozwala:
  - obejrzeć każde dziecko (klaster) jako siatkę kadrów twarzy,
  - poprawić NAZWISKO / KLASĘ (A/B),
  - przenieść błędnie przypisany kadr do innego dziecka (lub SZUM),
  - scalić dwoje "dzieci" w jedno (gdy AI rozbiło jedną osobę na 2 klastry),
  - ZAPISAĆ plan i wyEKSPORTOWAĆ do folderów (kopie zdjęć).

NIC nie rusza oryginałów — eksport tylko KOPIUJE.

Uruchom PO etapie 2:
  python scripts/face_panel.py
potem otwórz http://127.0.0.1:8770
"""
import os
import io
import json
import shutil
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

from PIL import Image

OUT_DIR = r"G:\Torun 2026 A i B\POSORTOWANE"
PLAN_FILE = os.path.join(OUT_DIR, "plan.json")
PORT = 8770
THUMB = 170  # px

_thumb_cache = {}


def load_plan():
    with open(PLAN_FILE, "r", encoding="utf-8") as fh:
        return json.load(fh)


def save_plan(plan):
    with open(PLAN_FILE, "w", encoding="utf-8") as fh:
        json.dump(plan, fh, ensure_ascii=False, indent=1)


def face_map(plan):
    m = {}
    for c in plan["clusters"]:
        for f in c["faces"]:
            m[int(f["fid"])] = f
    return m


def make_thumb(face):
    fid = int(face["fid"])
    if fid in _thumb_cache:
        return _thumb_cache[fid]
    path = face["path"]
    x1, y1, x2, y2 = face["bbox"]
    try:
        img = Image.open(path).convert("RGB")
    except Exception:
        img = Image.new("RGB", (THUMB, THUMB), (60, 60, 60))
        buf = io.BytesIO(); img.save(buf, "JPEG"); return buf.getvalue()
    w, h = img.size
    pad = int(0.4 * max(x2 - x1, y2 - y1))
    cx1, cy1 = max(0, x1 - pad), max(0, y1 - pad)
    cx2, cy2 = min(w, x2 + pad), min(h, y2 + pad)
    crop = img.crop((cx1, cy1, cx2, cy2))
    crop.thumbnail((THUMB, THUMB))
    buf = io.BytesIO()
    crop.save(buf, "JPEG", quality=82)
    data = buf.getvalue()
    if len(_thumb_cache) < 20000:
        _thumb_cache[fid] = data
    return data


PAGE = """<!doctype html><html><head><meta charset='utf-8'><title>Sortowanie twarzy</title>
<style>
body{font-family:Segoe UI,sans-serif;background:#0f1115;color:#e6e6e6;margin:0}
header{position:sticky;top:0;background:#171a21;padding:10px 16px;border-bottom:1px solid #2a2f3a;z-index:10;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
header h1{font-size:16px;margin:0}
button{background:#2b6cb0;color:#fff;border:0;border-radius:6px;padding:8px 12px;cursor:pointer;font-size:13px}
button.sec{background:#3a4150}
button.warn{background:#b7791f}
.card{margin:14px 16px;border:1px solid #2a2f3a;border-radius:10px;background:#151922}
.card h2{margin:0;padding:10px 14px;font-size:15px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #232838}
.badge{font-size:11px;padding:2px 8px;border-radius:20px;background:#2a3040}
.badge.name{background:#276749}.badge.klasa{background:#2c5282}.badge.szum{background:#742a2a}
input.name{background:#0f1115;border:1px solid #384050;color:#fff;border-radius:6px;padding:6px 8px;font-size:14px;min-width:220px}
select{background:#0f1115;border:1px solid #384050;color:#fff;border-radius:6px;padding:4px}
.grid{display:flex;flex-wrap:wrap;gap:8px;padding:12px}
.face{position:relative;border:2px solid transparent;border-radius:8px;overflow:hidden;background:#000}
.face img{display:block;height:150px}
.face .fx{position:absolute;top:2px;right:2px;background:#000a;color:#f66;border:0;border-radius:4px;cursor:pointer;font-size:12px;padding:1px 5px}
.face .mv{position:absolute;bottom:2px;left:2px;font-size:10px;max-width:120px}
.count{color:#9ab}
small{color:#89a}
</style></head><body>
<header>
  <h1>Sortowanie twarzy</h1>
  <span id="stat" class="count"></span>
  <button onclick="save()">💾 Zapisz plan</button>
  <button class="warn" onclick="apply()">📁 Eksportuj do folderów</button>
  <span id="msg"></span>
</header>
<div id="root"></div>
<script>
let plan=null;
async function load(){ const r=await fetch('/api/plan'); plan=await r.json(); render(); }
function folders(){ return plan.clusters.map(c=>c.folder); }
function render(){
  const root=document.getElementById('root'); root.innerHTML='';
  let nf=0;
  plan.clusters.forEach((c,ci)=>{
    nf+=c.faces.length;
    const card=document.createElement('div'); card.className='card';
    const kindBadge = c.kind==='nazwisko'?'<span class="badge name">nazwisko</span>':(c.kind==='szum'?'<span class="badge szum">szum</span>':'<span class="badge klasa">klasa</span>');
    const classSel = c.kind==='szum'?'':`Klasa: <select onchange="setClass(${ci},this.value)">
      ${['A','B','NIEPEWNE'].map(k=>`<option ${c.klasa===k?'selected':''}>${k}</option>`).join('')}</select>`;
    const mergeSel = `scal z: <select onchange="merge(${ci},this.value)"><option value="">—</option>
      ${plan.clusters.map((o,oi)=>oi!==ci?`<option value="${oi}">${o.folder}</option>`:'').join('')}</select>`;
    const h=document.createElement('h2');
    h.innerHTML=`${kindBadge}<input class="name" value="${c.folder.replace(/"/g,'&quot;')}" onchange="setName(${ci},this.value)">
      <span class="count">${c.faces.length} kadr.</span> ${classSel} ${mergeSel}
      <small>score ${c.score}</small>`;
    card.appendChild(h);
    const g=document.createElement('div'); g.className='grid';
    c.faces.forEach((f,fi)=>{
      const d=document.createElement('div'); d.className='face';
      d.innerHTML=`<img loading="lazy" src="/thumb?fid=${f.fid}" title="${f.path.split('\\\\').pop()} (wiek~${f.age})">
        <button class="fx" onclick="delFace(${ci},${fi})">✕</button>
        <select class="mv" onchange="moveFace(${ci},${fi},this.value)">
          <option value="">→ przenieś…</option>
          ${folders().map((fn,oi)=>oi!==ci?`<option value="${oi}">${fn}</option>`:'').join('')}
          <option value="__new">＋ nowe dziecko</option>
        </select>`;
      g.appendChild(d);
    });
    card.appendChild(g); root.appendChild(card);
  });
  document.getElementById('stat').textContent=`${plan.clusters.length} dzieci / grup · ${nf} kadrów`;
}
function setName(ci,v){ plan.clusters[ci].folder=v; }
function setClass(ci,v){ plan.clusters[ci].klasa=v; }
function delFace(ci,fi){ plan.clusters[ci].faces.splice(fi,1); render(); }
function moveFace(ci,fi,dest){
  if(dest==='')return;
  const f=plan.clusters[ci].faces.splice(fi,1)[0];
  if(dest==='__new'){ plan.clusters.push({id:Date.now(),folder:'NOWE dziecko',kind:'klasa',klasa:'NIEPEWNE',score:0,faces:[f]}); }
  else { plan.clusters[parseInt(dest)].faces.push(f); }
  render();
}
function merge(ci,dest){
  if(dest==='')return; const di=parseInt(dest);
  plan.clusters[di].faces=plan.clusters[di].faces.concat(plan.clusters[ci].faces);
  plan.clusters.splice(ci,1); render();
}
async function save(){ msg('Zapisywanie…'); await fetch('/api/save',{method:'POST',body:JSON.stringify(plan)}); msg('Zapisano ✔'); }
async function apply(){ if(!confirm('Skopiować zdjęcia do folderów wg aktualnego planu?'))return; msg('Eksport…');
  await fetch('/api/save',{method:'POST',body:JSON.stringify(plan)});
  const r=await fetch('/api/apply',{method:'POST'}); const j=await r.json(); msg('Gotowe: '+j.msg); }
function msg(t){ document.getElementById('msg').textContent=t; }
load();
</script></body></html>"""


class H(BaseHTTPRequestHandler):
    def _send(self, code, ctype, body):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/":
            self._send(200, "text/html; charset=utf-8", PAGE.encode("utf-8"))
        elif u.path == "/api/plan":
            with open(PLAN_FILE, "rb") as fh:
                self._send(200, "application/json; charset=utf-8", fh.read())
        elif u.path == "/thumb":
            fid = int(parse_qs(u.query)["fid"][0])
            fm = face_map(load_plan())
            face = fm.get(fid)
            if not face:
                self._send(404, "text/plain", b"no")
                return
            self._send(200, "image/jpeg", make_thumb(face))
        else:
            self._send(404, "text/plain", b"404")

    def do_POST(self):
        u = urlparse(self.path)
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n) if n else b"{}"
        if u.path == "/api/save":
            save_plan(json.loads(body.decode("utf-8")))
            self._send(200, "application/json", b'{"ok":true}')
        elif u.path == "/api/apply":
            msg = do_apply()
            self._send(200, "application/json", json.dumps({"msg": msg}).encode("utf-8"))
        else:
            self._send(404, "text/plain", b"404")


def do_apply():
    plan = load_plan()
    # zbierz per zdjęcie zbiór folderów
    photo_to_folders = {}
    for c in plan["clusters"]:
        if c.get("kind") == "szum":
            continue
        folder = c["folder"].strip() or "BEZ_NAZWY"
        for f in c["faces"]:
            photo_to_folders.setdefault(f["path"], set()).add(folder)
    copied = 0
    for path, folders in photo_to_folders.items():
        for folder in folders:
            dst_dir = os.path.join(OUT_DIR, safe(folder))
            os.makedirs(dst_dir, exist_ok=True)
            dst = os.path.join(dst_dir, os.path.basename(path))
            if not os.path.exists(dst):
                try:
                    shutil.copy2(path, dst)
                    copied += 1
                except Exception as e:
                    print("copy err", e)
    return f"skopiowano {copied} plików do {len(set().union(*photo_to_folders.values()) if photo_to_folders else [])} folderów"


def safe(name):
    for ch in '<>:"/\\|?*':
        name = name.replace(ch, "_")
    return name.strip()


def main():
    if not os.path.exists(PLAN_FILE):
        print("Brak plan.json — najpierw uruchom etap 2 (face_sort_cluster.py).")
        return
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
    url = f"http://127.0.0.1:{PORT}"
    print(f"Panel działa: {url}  (Ctrl+C aby zakończyć)")
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    srv.serve_forever()


if __name__ == "__main__":
    main()
