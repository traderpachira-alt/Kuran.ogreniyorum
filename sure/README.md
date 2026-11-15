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

Araç ayet sınırlarını sessizliklerden kesin olarak bulur. Ayet içindeki kelime zamanları harf
sayısına ve uzatmalara göre tahmin edilir; uzun meddlerde vurgu birkaç yüz milisaniye önde
ya da geride kalabilir.

## Şu anki kayıtlar

- `112.mp3` İhlâs: kullanıcının sağladığı "çocuk ezber" kaydı; Besmele + 4 ayet, sessizliklerden ayrıldı.
