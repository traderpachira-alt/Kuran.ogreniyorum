# Sure kayıtları

Her sure için hocanın kaydı ve kelime kelime zamanlaması burada durur:
`105.mp3` (Fil), `108.mp3` (Kevser), `112.mp3` (İhlâs) ve `sureler.json`.

## Kayıt nasıl yapılmalı

- Önce Besmele, sonra ayetler sırayla okunur (başta Eûzü okunursa araç onu atlar).
- **Her ayetten sonra yaklaşık 1 saniye durulur.** Araç ayetleri bu sessizliklerden ayırır.
- Sessiz bir ortamda, çocukların takip edebileceği yavaşlıkta (tahkik) okunmalı.
- WhatsApp sesli mesajı ya da telefonun ses kaydedicisi yeterli; video (MP4) da olur.

## Ekleme

    python3 tools/sure-ekle.py 112 ihlas.m4a
    python3 tools/sure-ekle.py 108 kevser.m4a
    python3 tools/sure-ekle.py 105 fil.m4a

Araç ayet sınırlarını sessizliklerden bulur. Ayet içindeki kelime sınırları, kayıttaki ses çukurlarından
harf sayısına (uzatmalar daha uzun) en uygun düşenler seçilerek bulunur; çukur yoksa orantılı bölünür.
Ayrıca perdesi korunarak 0.75 ve 0.5 hızında yavaş sürümler üretilir (rubberband).
Sondaki fazlalığı atmak için `--son <saniye>` verilir.

## Şu anki kayıtlar

- `112.mp3` İhlâs: kullanıcının sağladığı "çocuk ezber" kaydı; Besmele + 4 ayet. Sondaki gülme sesi atıldı:
  `python3 tools/sure-ekle.py 112 ihlas.mp3 --son 13.24`. `112-075.mp3` ve `112-050.mp3` yavaş sürümler.
- `subhaneke.mp3` Sübhâneke duası (namazda okunan biçim, "ve celle senâük" olmadan): kullanıcının sağladığı ezber kaydı; 4 satır.
- `108.mp3` Kevser: Besmele İhlâs kaydından (0,45–2,93 sn) alındı, 0,7 sn sessizlikten sonra kullanıcının sağladığı
  "3 tekrar ezber" kaydının ilk okunuşu (0–7,95 sn) eklendi. Zamanlamalar iki kaydın ayrı ayrı çıkarılmış
  zamanlamalarının kaydırılmasıyla yazıldı (Besmele −0,45 sn, ayetler +3,18 sn).
