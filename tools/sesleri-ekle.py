"""Hocanın kayıtlarını uygulamanın kalıcı seslerine (ses/ klasörü) ekler.

Üç tür girdi kabul eder:

  1) Uygulamadan alınan yedek dosyası (Anne-Baba > Harf seslerini kaydet > Yedek al)
       python3 tools/sesleri-ekle.py kuran-ogreniyorum-sesler-2026-11-14.json

  2) Harf başına ayrı ses dosyaları içeren bir klasör: 01.m4a (Elif), 02.m4a (Be) … 28.m4a (Ye)
       python3 tools/sesleri-ekle.py kayitlar/

  3) 28 harfin sırayla, aralarda kısa sessizlik bırakılarak okunduğu TEK bir kayıt
     (ör. WhatsApp sesli mesajı). Sessizliklerden bölünür.
       python3 tools/sesleri-ekle.py --tek-kayit elifba.m4a

Her ses: baştaki/sondaki sessizlik kırpılır, ses seviyesi eşitlenir ve her cihazda çalan
ses/NN.mp3 biçimine çevrilir. Liste ses/sesler.json dosyasına yazılır. ffmpeg gerekir.
"""
import base64
import json
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SES = ROOT / 'ses'
NAMES = ['Elif', 'Be', 'Te', 'Se', 'Cim', 'Ha', 'Hı', 'Dal', 'Zel', 'Ra', 'Ze', 'Sin', 'Şın', 'Sad',
         'Dad', 'Tı', 'Zı', 'Ayn', 'Ğayn', 'Fe', 'Kaf', 'Kef', 'Lam', 'Mim', 'Nun', 'Vav', 'He', 'Ye']
# Sessizlik kırpma; kısa harf seslerinde loudnorm güvenilir olmadığı için seviye tepe değere göre eşitlenir.
TRIM = ('silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.08,'
        'areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.15,areverse,'
        'afade=t=in:d=0.015')
PEAK_DB = -1.0


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def convert(src, i, start=None, end=None):
    """src dosyasını (isteğe bağlı olarak start-end aralığını) ses/NN.mp3 olarak yazar."""
    out = SES / f'{i + 1:02d}.mp3'
    with tempfile.TemporaryDirectory() as tmp:
        wav = pathlib.Path(tmp) / 'k.wav'
        cmd = ['ffmpeg', '-y', '-loglevel', 'error']
        if start is not None:
            cmd += ['-ss', f'{start:.3f}', '-to', f'{end:.3f}']
        cmd += ['-i', str(src), '-af', TRIM, '-ac', '1', '-ar', '44100', str(wav)]
        r = run(cmd)
        if r.returncode != 0 or not wav.exists():
            raise RuntimeError(f'{NAMES[i]} okunamadı: {r.stderr.strip()[:300]}')
        m = re.search(r'max_volume: (-?[\d.]+) dB', run(['ffmpeg', '-i', str(wav), '-af', 'volumedetect', '-f', 'null', '-']).stderr)
        gain = PEAK_DB - float(m.group(1)) if m else 0.0
        r = run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-af', f'volume={gain:.2f}dB,apad=pad_dur=0.08',
                 '-c:a', 'libmp3lame', '-b:a', '96k', str(out)])
    if r.returncode != 0 or not out.exists() or out.stat().st_size < 500:
        raise RuntimeError(f'{NAMES[i]} dönüştürülemedi: {r.stderr.strip()[:300]}')
    return out.name


def from_backup(path):
    data = json.loads(pathlib.Path(path).read_text(encoding='utf-8'))
    if data.get('app') != 'kuran-ogreniyorum' or 'recordings' not in data:
        sys.exit('Bu dosya bir Kur\'an Öğreniyorum ses yedeği değil.')
    done = {}
    with tempfile.TemporaryDirectory() as tmp:
        for k, v in sorted(data['recordings'].items(), key=lambda kv: int(kv[0])):
            i = int(k)
            if not 0 <= i < 28:
                continue
            src = pathlib.Path(tmp) / f'{i}.bin'
            src.write_bytes(base64.b64decode(v['data']))
            done[i] = convert(src, i)
    return done


def from_folder(path):
    done = {}
    for f in sorted(pathlib.Path(path).iterdir()):
        m = re.match(r'^(\d{1,2})\b', f.stem)
        if f.is_file() and m and 1 <= int(m.group(1)) <= 28:
            i = int(m.group(1)) - 1
            done[i] = convert(f, i)
    return done


def duration(path):
    r = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)])
    return float(r.stdout.strip())


def speech_parts(path, noise_db, min_silence):
    """Sessizlik aralıklarını bulup aradaki konuşma parçalarını döndürür."""
    r = run(['ffmpeg', '-hide_banner', '-i', str(path), '-af',
             f'silencedetect=noise={noise_db}dB:d={min_silence}', '-f', 'null', '-'])
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r.stderr)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r.stderr)]
    total = duration(path)
    parts, cursor = [], 0.0
    for s, e in zip(starts, ends + [total] * (len(starts) - len(ends))):
        if s - cursor > 0.15:
            parts.append((cursor, s))
        cursor = e
    if total - cursor > 0.15:
        parts.append((cursor, total))
    return parts


def from_single(path):
    for min_silence in (0.6, 0.5, 0.8, 0.4, 1.0, 0.3):
        for noise_db in (-35, -30, -40, -45, -25):
            parts = speech_parts(path, noise_db, min_silence)
            if len(parts) == 28:
                print(f'28 harf bulundu (sessizlik ≥ {min_silence}s, eşik {noise_db}dB).')
                return {i: convert(path, i, max(0, a - 0.08), b + 0.12) for i, (a, b) in enumerate(parts)}
    sys.exit('Kayıt 28 parçaya bölünemedi. Harfler arasında 1 saniye kadar sessizlik bırakarak '
             'yeniden kaydedin ya da harfleri ayrı ayrı gönderin.')


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    SES.mkdir(exist_ok=True)
    if args[0] == '--tek-kayit':
        done = from_single(pathlib.Path(args[1]))
    elif pathlib.Path(args[0]).is_dir():
        done = from_folder(args[0])
    else:
        done = from_backup(args[0])
    if not done:
        sys.exit('Eklenecek ses bulunamadı.')
    manifest_path = SES / 'sesler.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    manifest.update({str(i): name for i, name in done.items()})
    manifest = dict(sorted(manifest.items(), key=lambda kv: int(kv[0])))
    manifest_path.write_text(json.dumps(manifest, indent=1) + '\n')
    print(f'{len(done)} harf eklendi:', ', '.join(NAMES[i] for i in sorted(done)))
    eksik = [NAMES[i] for i in range(28) if str(i) not in manifest]
    print('Kaydı olmayan harfler:', ', '.join(eksik) if eksik else 'yok, 28 harfin hepsi tamam.')


if __name__ == '__main__':
    main()
