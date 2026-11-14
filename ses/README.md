# Uygulamayla gelen harf sesleri

Bu klasördeki kayıtlar uygulamayı açan **herkese** çalınır (bir hocanın sesi gibi).
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

3. **Ayrı dosyalar:** `01.m4a` (Elif), `02.m4a` (Be) … `28.m4a` (Ye) adlı dosyaların olduğu bir klasör.

       python3 tools/sesleri-ekle.py kayitlar/

Sonra değişiklikleri depoya gönderip uygulamayı yeniden yayınlayın.
