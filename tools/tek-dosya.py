"""index.html + style.css + app.js dosyalarını paylaşılabilir tek bir sayfada birleştirir.

Kullanım:  python3 tools/tek-dosya.py <çıktı.html>
Çıktı, claude.ai bağlantısı (Artifact) olarak yayınlanan sürümdür: <html>/<head>/<body> etiketleri
yayın sırasında eklendiği için çıkarılır; CSS ve JS sayfanın içine gömülür.
"""
import pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
head = html[html.index('<head>') + 6:html.index('</head>')]
body = html[html.index('<body>') + 6:html.index('</body>')]
head = re.sub(r'<meta charset[^>]*>\n|<meta name="viewport"[^>]*>\n|<link rel="(manifest|apple-touch-icon|icon)"[^>]*>\n', '', head)
page = head.strip() + '\n' + body
page = page.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (root / 'style.css').read_text(encoding='utf-8') + '</style>')
# ses/ klasöründeki kayıtlar sayfanın içine gömülür (tek dosyada dış dosya yüklenemez)
clips = ''
manifest = root / 'ses' / 'sesler.json'
if manifest.exists():
    import base64, json
    data = {k: base64.b64encode((root / 'ses' / f).read_bytes()).decode() for k, f in json.loads(manifest.read_text()).items()}
    clips = '<script>window.KURAN_CLIPS = ' + json.dumps(data) + ';</script>\n'
# Sure kayıtları ve zamanlamaları da gömülür
sure_js = ''
sm = root / 'sure' / 'sureler.json'
if sm.exists():
    import base64, json
    man = json.loads(sm.read_text(encoding='utf-8'))
    b64 = lambda f: base64.b64encode((root / 'sure' / f).read_bytes()).decode()
    emb = {no: {'sesler': {r: b64(f) for r, f in v.get('hizlar', {'1': v['dosya']}).items()}, 'timing': v} for no, v in man.items()}
    sure_js = '<script>window.KURAN_SURE = ' + json.dumps(emb, ensure_ascii=False) + ';</script>\n'
page = page.replace('<script src="sureler-veri.js"></script>', sure_js + '<script>\n' + (root / 'sureler-veri.js').read_text(encoding='utf-8') + '</script>')
page = page.replace('<script src="sureler.js"></script>', '<script>\n' + (root / 'sureler.js').read_text(encoding='utf-8') + '</script>')
page = page.replace('<script src="bahce3d.js"></script>', '<script>\n' + (root / 'bahce3d.js').read_text(encoding='utf-8') + '</script>')
page = page.replace('<script src="app.js"></script>', clips + '<script>\n' + (root / 'app.js').read_text(encoding='utf-8') + '</script>')
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'dist/kuran-ogreniyorum.html')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page, encoding='utf-8')
print('Yazıldı:', out)
