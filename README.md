# Kur'an Öğreniyorum 🌙

4–6 yaş çocuklara **Arapça harfleri (Elif-Ba)** oyunlarla tanıtan, telefonda ve tablette çalışan bir web uygulaması.
Kurulum gerektirmez, internet olmadan da çalışır (PWA) ve ana ekrana uygulama gibi eklenebilir.

## Nasıl çalıştırılır?

```bash
python3 -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresini açın. Telefonda/tablette "Ana ekrana ekle" ile uygulama gibi kullanılabilir.
Herhangi bir statik barındırma servisine (GitHub Pages, Netlify vb.) olduğu gibi yüklenebilir.

## Tasarım ilkeleri (4–6 yaş)

- **Okuma bilmeden kullanılabilir:** Her bölüm büyük bir resim (emoji) ile gösterilir; yönergeler sesli okunur.
- **Büyük dokunma alanları:** Tüm düğmeler küçük parmaklar için en az 56 px.
- **Ceza yok, hep teşvik var:** Yanlış cevapta kart sallanır ve harf tekrar okunur; doğru cevapta konfeti, "Aferin!", "Maşallah!" gibi sesli övgüler ve yıldızlar gelir.
- **Kısa oturumlar:** Her oyun 1–2 dakikada biter ve bir ödül ekranıyla kapanır.
- **Adım adım ilerleme:** Oyunlar, çocuğun *Harfleri Tanı* bölümünde gördüğü harflerle oynanır (en az 4 harf). Böylece yeni harfler zorlamadan, sırayla eklenir.
- **Ebeveyn kilidi:** Ayarlar, basit bir toplama sorusunun arkasındadır.

## Bölümler

| Bölüm | Ne öğretir? | Nasıl oynanır? |
|---|---|---|
| 📖 **Harfleri Tanı** | Harfin şekli ve adı | Büyük harf kartı; dokununca harf okunur. Altında harfi hatırlatan ipucu yer alır ("Altında 1 nokta" gibi). |
| 👂 **Dinle ve Bul** | Sesi şekille eşleştirme | Harf okunur, çocuk 3–4 seçenekten doğrusunu seçer. 6 tur. |
| ✏️ **Harf Çiz** | Harfin yazılışı, ince motor beceri | Parmakla kesikli çizgili harfin üstünden geçilir. Uygulama çizimin harfi ne kadar kapladığını ölçer ve yeterince iyiyse kutlar. |
| 🎈 **Balon Patlat** | Hızlı tanıma | Yükselen balonlardan hedef harfi taşıyanları patlat. 5 balon. |
| 🧩 **Hafıza Kartları** | Görsel hafıza | Kartları çevir, aynı harfleri eşleştir (3–4 çift). |
| 🌷 **Harf Bahçem** | İlerlemeyi görmek | 28 harf; görülen harfler 🌱 filiz, en az 3 kez doğru bilinen harfler 🌸 çiçek olur. |

## Ses

- Harfler cihazın **metin okuma (TTS)** motoruyla okunur. Cihazda **Arapça ses** varsa harf adları Arapça (أَلِف، بَاء …) okunur, yoksa Türkçe isimleri (Elif, Be …) okunur. Ayar, Anne-Baba bölümünden değiştirilebilir.
- Oyun sesleri (doğru, yanlış, balon patlaması) Web Audio ile üretilir; ses dosyası gerekmez.
- İleride kayıtlı, gerçek bir hocanın sesiyle (mp3) değiştirmek için `app.js` içindeki `sayLetter` fonksiyonunu güncellemek yeterlidir.

## Dosyalar

- `index.html` — ekranlar
- `style.css` — görünüm
- `app.js` — harf verisi, oyunlar, ilerleme kaydı (tarayıcının yerel depolaması)
- `sw.js`, `manifest.json`, `icon.svg` — çevrimdışı çalışma ve ana ekrana ekleme

## Gelecek fikirleri

- Harekeler (üstün, esre, ötre) ve hece okuma bölümü
- Harflerin başta/ortada/sonda yazılışları
- Gerçek ses kayıtları ve kısa animasyonlu harf hikâyeleri
- Kısa sureler için dinle-tekrarla bölümü
