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
- **Hak edilen yıldız:** Yıldız yalnızca bir bölüm tamamlanınca, başarıya göre 1–3 olarak verilir; tek tek doğru cevaplar ya da harf görmek yıldız vermez. Dinle ve Bul ve Balon Patlat'ta hatasız 3, 1–2 hatada 2, daha fazlasında 1; Hafıza Kartları'nda çift sayısı kadar yanlış eşleşmeye kadar 3; Harf Çiz'de 3 harflik turda silgi kullanımı hata sayılır. Yıldız hiçbir zaman geri alınmaz.
- **Adım adım ilerleme:** Oyunlar, çocuğun *Harfleri Tanı* bölümünde gördüğü harflerle oynanır (en az 4 harf). Böylece yeni harfler zorlamadan, sırayla eklenir.
- **Çocuğa adıyla seslenme:** Anne-Baba bölümüne çocuğun adı yazılırsa Hilal övgü ve yönergelerde ona adıyla seslenir (övgülerde "Aferin, Ayşe!", yönergelerde "Ayşe, bul bakalım!"). Ad, Türkçe ek gerektirmeyecek şekilde hitap olarak eklenir; tekdüze olmasın diye bazı cümlelerde kullanılır. Ad yalnızca o cihazda saklanır.
- **Ebeveyn kilidi:** Ayarlar, basit bir toplama sorusunun arkasındadır.

## Bölümler

| Bölüm | Ne öğretir? | Nasıl oynanır? |
|---|---|---|
| 📖 **Harfleri Tanı** | Harfin şekli ve adı | Büyük harf kartı; dokununca harf okunur. Altında harfi hatırlatan ipucu yer alır ("Altında 1 nokta" gibi). |
| 👂 **Dinle ve Bul** | Sesi şekille eşleştirme | Harf okunur, çocuk 3–4 seçenekten doğrusunu seçer. 6 tur. |
| ✏️ **Harf Çiz** | Harfin yazılışı, ince motor beceri | Parmakla kesikli çizgili harfin üstünden geçilir; kalem rengini çocuk seçer (9 renk ve gökkuşağı). Boya yalnızca harfin içinde görünür, dışarı taşmaz. Harfin gövdesi ve her noktası ayrı ayrı kontrol edilir; nokta eksikse "Noktaları da unutma!" denir. Bir tur 3 harftir. Uygulama çizimin harfi ne kadar kapladığını ölçer ve yeterince iyiyse kutlar. |
| 🎈 **Balon Patlat** | Hızlı tanıma | Yükselen balonlardan hedef harfi taşıyanları patlat. 5 balon. |
| 🧩 **Hafıza Kartları** | Görsel hafıza | Kartları çevir, aynı harfleri eşleştir (3–4 çift). |
| 🌷 **Harf Bahçem** | İlerlemeyi görmek | 28 harf; görülen harfler 🌱 filiz, en az 3 kez doğru bilinen harfler 🌸 çiçek olur. |
| 🎁 **Yıldız Dükkanı** | Motivasyon | Bölüm sonunda kazanılan yıldızlarla bahçeye düşük poligonlu 3B hayvanlar ve süsler alınır (civciv, tavşan, kedi, kuzu, kaplumbağa, ördek, deve, kuş, kelebek, ağaç, ev, cami …). Hayvanlar bahçede kendi kendine dolaşır, kuşlar ve kelebekler uçar; dokununca zıplarlar, parmakla başka yere taşınabilirler. Hilal'e taç, şapka gibi süsler de alınır. Fiyatlar 2–15 yıldız. 3B desteklenmeyen cihazlarda bahçe emoji çıkartmalarla gösterilir. |
| 📜 **Sureler ve Dualar** | İhlâs, Kevser, Fil, Sübhâneke | Sure ekranda Osmanî hatla, her ayetin altında Türkçe okunuşuyla görünür. Hocanın kaydı çalarken okunan kelimeler belirginleşir; okunmakta olan kelime sağdan sola dolar. Ayete ya da kelimeye dokununca yalnız o kısım okunur. Okuma 1x, 0,75x ve 0,5x hızında dinlenebilir (perde bozulmaz). **Birlikte oku** modunda her ayetten sonra çocuğun tekrar etmesi için durulur. Sure sonuna kadar dinlenince günde bir kez 3 yıldız verilir. |
| 🔤 **Elif-Ba Tablosu** | Harflerin okunuşu | 28 harf tek ekranda; hangisine dokunulursa o harf okunur. Serbest keşif içindir.

## Ses

Harfler **üstünlü okunuşlarıyla** öğretilir: بَ Be, جَ Ce, دَ De, مَ Me … Kartlarda ve Elif-Ba Tablosu'nda harf üstünlü yazılır (üstün işaretiyle); harfin adı (Cim, Dal, Mim …) ebeveyn için kartın altındaki ipucunda yazar. Aynı okunan harfler (حَ/خَ Ha, ثَ/سَ Se, ذَ/زَ Ze) Dinle ve Bul'da aynı soruda seçenek olarak çıkmaz.

Harf okunurken sırasıyla şunlar denenir:

1. **Ebeveynin kendi sesi:** Anne-Baba → *Harf seslerini kaydet* ekranından kaydedilen sesler (o cihazda, IndexedDB'de kalıcı).
2. **Hocanın sesi:** `ses/` klasöründeki kayıtlar herkese çalınır. Kayıtlar `tools/sesleri-ekle.py` ile eklenir (ayrıntı: [`ses/README.md`](ses/README.md)). Şu anki kayıtlar, sahibinin izniyle, harflerin üstünlü okunuşlarının okunduğu bir videodan alınmıştır.
3. **Yapay ses:** Kayıt yoksa cihazın metin okuma sesi.

Kayıtlar Web Audio ile önceden çözülüp çalınır; dokununca beklemeden başlar. Oyun sesleri de Web Audio ile üretilir.

## Paylaşılabilir tek dosya

`python3 tools/tek-dosya.py çıktı.html` komutu üç dosyayı ve `ses/` kayıtlarını tek bir sayfada birleştirir. claude.ai bağlantısı olarak yayınlanan sürüm budur.

## Dosyalar

- `index.html` — ekranlar
- `style.css` — görünüm
- `app.js` — harf verisi, oyunlar, ilerleme kaydı (tarayıcının yerel depolaması)
- `sw.js`, `manifest.json`, `icon.svg` — çevrimdışı çalışma ve ana ekrana ekleme
- `ses/` — isteğe bağlı kayıtlı harf sesleri
- `sureler.js`, `sureler-veri.js` — Sureler bölümü ve sure metinleri (quran-json 3.1.2, CC BY-SA 4.0; Kral Fehd Mushaf Kompleksi Hafs metni)
- `sure/` — hocanın sure kayıtları ve kelime zamanlamaları (`tools/sure-ekle.py` ile eklenir)
- `bahce3d.js` — Yıldız Dükkanı'ndaki 3B bahçe (Three.js r128, cdnjs'ten yüklenir)
- `tools/tek-dosya.py` — paylaşılabilir tek sayfa üretir
- `tools/sesleri-ekle.py` — hocanın kayıtlarını `ses/` klasörüne ekler (ffmpeg gerekir)

## Gelecek fikirleri

- Harekeler (üstün, esre, ötre) ve hece okuma bölümü
- Harflerin başta/ortada/sonda yazılışları
- Gerçek ses kayıtları ve kısa animasyonlu harf hikâyeleri
- Kısa sureler için dinle-tekrarla bölümü
