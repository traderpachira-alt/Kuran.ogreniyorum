# Uygulamayla gelen harf sesleri

Bu klasördeki kayıtlar uygulamayı açan **herkese** çalınır (bir hocanın sesi gibi).
Harfler **üstünlü** okunur: 01 = اَ E, 02 = بَ Be, 03 = تَ Te … 05 = جَ Ce … 28 = يَ Ye.
Kaydı olmayan harflerde cihazın yapay sesi kullanılır. Ebeveynin kendi cihazında yaptığı kayıtlar
bunların da önüne geçer.

Hangi dosyanın hangi harf olduğu `sesler.json` içinde yazar (`"0"` = Elif … `"27"` = Ye).
Bu dosyaları elle değil, `tools/sesleri-ekle.py` ile ekleyin; araç sessizliği kırpar,
ses seviyesini eşitler ve her cihazda çalan `.m4a` biçimine çevirir.

## Hocadan ses almanın üç yolu

1. **Uygulamadan yedek (önerilen):** Hoca uygulamayı açar → Anne-Baba → *Harf seslerini kaydet*.
   Harfleri kaydeder (🎙️ ya da telefonun ses kaydedicisi + 📁), sonra **📤 Yedek al** ile
   `kuran-ogreniyorum-sesler-....json` dosyasını alıp size gönderir.

       python3 tools/sesleri-ekle.py kuran-ogreniyorum-sesler-2026-11-14.json

2. **Tek kayıt:** Hoca 28 harfi Elif'ten Ye'ye sırayla, her harften sonra yaklaşık 1 saniye
   durarak tek seferde okur (WhatsApp sesli mesajı da olur). Araç kaydı sessizliklerden böler.

       python3 tools/sesleri-ekle.py --tek-kayit elifba.m4a

3. **Ayrı dosyalar:** `01` (E), `02` (Be) … `28` (Ye) ile başlayan adlarda ses dosyalarının olduğu bir klasör.

       python3 tools/sesleri-ekle.py kayitlar/

Sonra değişiklikleri depoya gönderip uygulamayı yeniden yayınlayın.

## Şu anki kayıtlar

`01.mp3` … `28.mp3`: Harflerin üstünlü okunuşları; sahibinin izniyle bir YouTube videosunun sesinden, `--tek-kayit` ile bölünerek alındı.
