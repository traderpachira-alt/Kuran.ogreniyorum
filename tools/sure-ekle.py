"""Bir surenin ses kaydını uygulamaya ekler ve kelime kelime zamanlamasını çıkarır.

Kullanım:
    python3 tools/sure-ekle.py 112 ihlas.m4a      # İhlâs
    python3 tools/sure-ekle.py 108 kevser.mp3     # Kevser
    python3 tools/sure-ekle.py 105 fil.mp3        # Fil

Kayıt nasıl olmalı: Besmele ve ayetler sırayla, her ayetten sonra ~1 saniye durarak okunur.
(Başta Eûzü okunduysa o da ayrı bir parça olarak tanınır ve atlanır.)

Araç ne yapar:
  1) Kaydı sessizliklerden ayetlere böler (Besmele + ayet sayısı kadar parça bekler).
  2) Her ayetin içinde kelimelere süre dağıtır: önce ayet içindeki kısa duraklara bakar,
     kalan kısmı harf sayısına (uzatmalar daha uzun sayılır) göre paylaştırır.
  3) Sesi temizleyip sure/NNN.mp3 olarak, zamanlamayı sure/sureler.json içine yazar.
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
        if s - cursor > 0.2:
            parts.append([cursor, s])
        cursor = e
    if total - cursor > 0.2:
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


def word_times(words, start, end):
    ws = [weight(w) for w in words]
    total = sum(ws)
    out, t = [], start
    for w in ws:
        d = (end - start) * w / total
        out.append([round(t, 3), round(t + d, 3)])
        t += d
    return out


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    no, src = sys.argv[1], pathlib.Path(sys.argv[2])
    if no not in TEXT:
        sys.exit(f'{no} numaralı sure listede yok. Var olanlar: {", ".join(TEXT)}')
    sure = TEXT[no]
    lines = [TEXT['besmele']] + sure['ayetler']            # okunacak satırlar: Besmele + ayetler
    OUT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        wav = pathlib.Path(tmp) / 's.wav'
        # Temizle: mono, baş/son sessizlik kırpılmaz (zamanlama kaymasın), seviye eşitlenir
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-ac', '1', '-ar', '44100', '-af', 'loudnorm=I=-16:TP=-1.5', str(wav)])
        found = None
        for d in (0.6, 0.5, 0.8, 0.45, 1.0, 0.35, 1.3):
            for db in (-35, -32, -38, -30, -42, -28, -45):
                parts = speech_parts(wav, db, d)
                if len(parts) in (len(lines), len(lines) + 1, len(lines) - 1):
                    found = (parts, d, db)
                    break
            if found:
                break
        if not found:
            sys.exit(f'Kayıt {len(lines)} parçaya (Besmele + {len(sure["ayetler"])} ayet) bölünemedi. '
                     'Ayetler arasında yaklaşık 1 saniye durarak yeniden kaydedin.')
        parts, d, db = found
        besmele = True
        if len(parts) == len(lines) + 1:
            print('Başta fazladan bir parça var (Eûzü olabilir); atlanıyor.')
            parts = parts[1:]
        elif len(parts) == len(lines) - 1:
            print('Besmele bulunamadı; kayıt doğrudan ayetlerle başlıyor kabul edildi.')
            besmele = False
            lines = lines[1:]
        print(f'{len(parts)} parça bulundu (sessizlik ≥ {d}s, eşik {db}dB).')
        segs = []
        for (a, b), line in zip(parts, lines):
            words = line.split()
            segs.append({'s': round(a, 3), 'e': round(b, 3), 'w': word_times(words, a, b)})
        out_mp3 = OUT / f'{int(no):03d}.mp3'
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-c:a', 'libmp3lame', '-b:a', '64k', str(out_mp3)])
    manifest_path = OUT / 'sureler.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    manifest[no] = {'dosya': out_mp3.name, 'besmele': besmele, 'satirlar': segs}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{sure["ad"]} eklendi: {out_mp3.name}, {len(segs)} satır.')
    for k, s in enumerate(segs):
        print(f'  {"Besmele" if besmele and k == 0 else "Ayet " + str(k + (0 if besmele else 1))}: {s["s"]:.2f}–{s["e"]:.2f} sn, {len(s["w"])} kelime')


if __name__ == '__main__':
    main()
