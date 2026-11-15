"""Bir surenin ses kaydını uygulamaya ekler ve kelime kelime zamanlamasını çıkarır.

Kullanım:
    python3 tools/sure-ekle.py 112 ihlas.m4a      # İhlâs
    python3 tools/sure-ekle.py 112 ihlas.m4a --son 12.68   # 12.68. saniyeden sonrasını at (gülme, konuşma vb.)
    python3 tools/sure-ekle.py 108 kevser.mp3     # Kevser
    python3 tools/sure-ekle.py 105 fil.mp3        # Fil

Kayıt nasıl olmalı: Besmele ve ayetler sırayla, her ayetten sonra ~1 saniye durarak okunur.
(Başta Eûzü okunduysa o da ayrı bir parça olarak tanınır ve atlanır.)

Araç ne yapar:
  1) Kaydı sessizliklerden ayetlere böler (Besmele + ayet sayısı kadar parça bekler).
  2) Her ayetin içinde kelimelere süre dağıtır: önce ayet içindeki kısa duraklara bakar,
     kalan kısmı harf sayısına (uzatmalar daha uzun sayılır) göre paylaştırır.
  3) Sesi temizleyip sure/NNN.mp3 olarak, zamanlamayı sure/sureler.json içine yazar.
  4) Perdeyi bozmadan yavaşlatılmış 0.75 ve 0.5 hız sürümlerini üretir (NNN-075.mp3, NNN-050.mp3).
ffmpeg gerekir.
"""
import json
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'sure'
sys.path.insert(0, str(ROOT / 'tools'))

# Metin uygulamayla aynı dosyadan (sureler-veri.js) okunur. Kelimeler boşlukla ayrılır.
_src = (ROOT / 'sureler-veri.js').read_text(encoding='utf-8')
TEXT = json.loads(_src[_src.index('{'):_src.rindex('}') + 1])

HARAKAT = set('ًٌٍَُِّْٰٕٖٓٔۡۢۥۦۭ')
LONG = set('اويٰٓى')  # uzatma harfleri ve işaretleri


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def duration(path):
    return float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)]).stdout)


def speech_parts(path, noise_db, min_silence):
    r = run(['ffmpeg', '-hide_banner', '-i', str(path), '-af', f'silencedetect=noise={noise_db}dB:d={min_silence}', '-f', 'null', '-'])
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r.stderr)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r.stderr)]
    total = duration(path)
    parts, cursor = [], 0.0
    for s, e in zip(starts, ends + [total] * (len(starts) - len(ends))):
        if s - cursor > 0.35:          # çok kısa parçalar (nefes, tık) okuma sayılmaz
            parts.append([cursor, s])
        cursor = e
    if total - cursor > 0.35:
        parts.append([cursor, total])
    return parts


def weight(word):
    """Kelimenin okunma süresine yaklaşık ağırlık: harf sayısı, uzatmalar ve şeddeler daha uzun."""
    w = 0.0
    for ch in word:
        if ch in HARAKAT:
            if ch == 'ّ':
                w += 0.6          # şedde
            elif ch == 'ٓ':
                w += 1.5          # medd işareti
            elif ch == 'ٰ':
                w += 1.0          # üstün elif (uzatma)
            continue
        w += 1.6 if ch in LONG else 1.0
    return max(w, 1.0)


STEP = 0.02   # zarf çözünürlüğü (saniye)


def envelope(path):
    """Sesin 20 ms'lik pencerelerde dB cinsinden yüksekliği (numpy varsa)."""
    try:
        import numpy as np
    except ImportError:
        return None
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', '16000', '-f', 's16le', '-'],
                         capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    n = int(16000 * STEP)
    x = x[: len(x) // n * n].reshape(-1, n)
    return 20 * np.log10(np.sqrt((x ** 2).mean(axis=1)) + 1e-6)


def refine(env, a, b):
    """Parçanın başını/sonunu sesin gerçekten başladığı/bittiği yere çeker (parçanın en yüksek yerinin 20 dB altı)."""
    if env is None:
        return a, b
    i, j = int(a / STEP), min(int(b / STEP), len(env) - 1)
    thr = max(-40.0, float(env[i:j + 1].max()) - 20)
    while i < j and env[i] < thr:
        i += 1
    while j > i and env[j] < thr:
        j -= 1
    return i * STEP, (j + 1) * STEP


def dips(env, start, end):
    """Ayet içindeki belirgin ses çukurları (kelime arası olabilecek yerler)."""
    i0, i1 = int(start / STEP) + 4, int(end / STEP) - 4
    out = []
    for i in range(i0, i1):
        if env[i] > env[max(i0, i - 3):i + 4].min():
            continue
        around = max(env[max(0, i - 8):i].max(initial=-99), env[i + 1:i + 9].max(initial=-99))
        if around - env[i] >= 8:
            if out and i * STEP - out[-1][0] < 0.08:
                continue
            out.append((i * STEP + STEP / 2, float(around - env[i])))
    return out


def word_times(words, start, end, env=None):
    """Ayet süresini kelimelere paylaştırır.
    Ses çukurları varsa: harf ağırlığına göre beklenen sürelere en uygun çukurları seçer (dinamik programlama).
    Yoksa: harf ağırlığıyla orantılı böler."""
    ws = [weight(w) for w in words]
    total, K = sum(ws), len(words)
    exp = [(end - start) * w / total for w in ws]
    if K > 1 and env is not None:
        import math
        dip = dips(env, start, end)
        # Aday sınırlar: her 40 ms bir nokta; ses çukuruna denk gelenler ödüllendirilir (ceza 0), diğerleri 0.35 ceza alır.
        grid = [start + k * 0.04 for k in range(1, int((end - start) / 0.04))]
        P = [start] + sorted(set([round(g, 3) for g in grid] + [round(d, 3) for d, _ in dip])) + [end]
        # Derin çukur (neredeyse sessizlik) kelime arası olma ihtimali yüksek: ödül; sığ çukur: nötr; çukur yok: ceza
        def pen_at(x):
            best = [depth for d, depth in dip if abs(x - d) < 0.03]
            return -min(0.8, (max(best) - 8) / 20) if best else 0.35
        pen = [pen_at(x) for x in P]
        n, INF = len(P), float('inf')
        dp = [[INF] * n for _ in range(K + 1)]
        back = [[0] * n for _ in range(K + 1)]
        dp[0][0] = 0
        for k in range(1, K + 1):
            for j in range(1, n):
                if k == K and j != n - 1:
                    continue
                for i in range(j):
                    if dp[k - 1][i] == INF:
                        continue
                    d = P[j] - P[i]
                    if d < 0.15:                      # kelime 150 ms'den kısa olamaz
                        continue
                    c = dp[k - 1][i] + 2.0 * math.log(d / exp[k - 1]) ** 2 + (pen[j] if j != n - 1 else 0)
                    if c < dp[k][j]:
                        dp[k][j], back[k][j] = c, i
        if dp[K][n - 1] < INF:
            idx, j = [n - 1], n - 1
            for k in range(K, 0, -1):
                j = back[k][j]
                idx.append(j)
            bounds = [P[i] for i in reversed(idx)]
            return [[round(bounds[k], 3), round(bounds[k + 1], 3)] for k in range(K)]
    bounds, t = [start], start
    for d in exp:
        t += d
        bounds.append(t)
    return [[round(bounds[k], 3), round(bounds[k + 1], 3)] for k in range(K)]


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    no, src = sys.argv[1], pathlib.Path(sys.argv[2])
    son = float(sys.argv[sys.argv.index('--son') + 1]) if '--son' in sys.argv else None
    if no not in TEXT:
        sys.exit(f'{no} numaralı sure listede yok. Var olanlar: {", ".join(TEXT)}')
    sure = TEXT[no]
    # okunacak satırlar: Besmele + ayetler (dualarda Besmele yok)
    lines = ([] if sure.get('besmele') is False else [TEXT['besmele']]) + sure['ayetler']
    base = f'{int(no):03d}' if no.isdigit() else no
    OUT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        wav = pathlib.Path(tmp) / 's.wav'
        # Temizle: mono, baş/son sessizlik kırpılmaz (zamanlama kaymasın), seviye eşitlenir
        af = 'loudnorm=I=-16:TP=-1.5'
        if son:   # kaydın sonundaki fazlalığı at, kısa bir sönümle bitir
            af = f'atrim=0:{son},afade=t=out:st={max(0, son - 0.06):.3f}:d=0.06,apad=pad_dur=0.4,' + af
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-ac', '1', '-ar', '44100', '-af', af, str(wav)])
        # Önce tam olarak Besmele + ayet sayısı kadar parça veren ayarı ara; yoksa Eûzü'lü (+1),
        # en son Besmelesiz (-1) kabul et. Hızlı okumalarda ayetler arası durak kısa olabilir.
        tries = [(d, db, speech_parts(wav, db, d))
                 for d in (0.6, 0.5, 0.8, 0.45, 1.0, 0.35, 0.3, 0.25, 0.2)
                 for db in (-35, -32, -38, -30, -42, -28, -45)]
        found = None
        wants = (len(lines), len(lines) + 1) if sure.get('besmele') is False else (len(lines), len(lines) + 1, len(lines) - 1)
        for want in wants:
            found = next(((p, d, db) for d, db, p in tries if len(p) == want), None)
            if found:
                break
        if not found:
            sys.exit(f'Kayıt {len(lines)} parçaya bölünemedi. '
                     'Ayetler arasında yaklaşık 1 saniye durarak yeniden kaydedin.')
        parts, d, db = found
        besmele = sure.get('besmele') is not False
        if len(parts) == len(lines) + 1:
            print('Başta fazladan bir parça var (Eûzü olabilir); atlanıyor.')
            parts = parts[1:]
        elif len(parts) == len(lines) - 1:
            print('Besmele bulunamadı; kayıt doğrudan ayetlerle başlıyor kabul edildi.')
            besmele = False
            lines = lines[1:]
        print(f'{len(parts)} parça bulundu (sessizlik ≥ {d}s, eşik {db}dB).')
        env = envelope(wav)
        segs = []
        for (a, b), line in zip(parts, lines):
            a, b = refine(env, a, b)
            words = line.split()
            segs.append({'s': round(a, 3), 'e': round(b, 3), 'w': word_times(words, a, b, env)})
        out_mp3 = OUT / f'{base}.mp3'
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-c:a', 'libmp3lame', '-b:a', '64k', str(out_mp3)])
        speeds = {'1': out_mp3.name}
        for rate in (0.75, 0.5):        # perdeyi koruyarak yavaşlat (rubberband; yoksa atempo)
            name = f'{base}-{int(rate * 100):03d}.mp3'
            r = run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-af', f'rubberband=tempo={rate}:pitchq=quality',
                     '-c:a', 'libmp3lame', '-b:a', '64k', str(OUT / name)])
            if r.returncode != 0:
                run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-af', f'atempo={rate}',
                     '-c:a', 'libmp3lame', '-b:a', '64k', str(OUT / name)])
            speeds[str(rate)] = name
    manifest_path = OUT / 'sureler.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    manifest[no] = {'dosya': out_mp3.name, 'hizlar': speeds, 'besmele': besmele, 'satirlar': segs}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{sure["ad"]} eklendi: {out_mp3.name}, {len(segs)} satır.')
    for k, s in enumerate(segs):
        print(f'  {"Besmele" if besmele and k == 0 else "Satır " + str(k + (0 if besmele else 1))}: {s["s"]:.2f}–{s["e"]:.2f} sn, {len(s["w"])} kelime')


if __name__ == '__main__':
    main()
