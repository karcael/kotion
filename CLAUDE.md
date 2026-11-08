## Dil
- Tüm yanıtları Türkçe ver. Yanıt verirken Türkçe karakter kullanmaya özen göster.
- Oluşturulan kod ve iş sonuçlarında Türkçe'nin, Türkçe karakterlerin ve imla kurallarının düzgün olmasına dikkat et. Örneğin cümle ise sonunda nokta olmasına dikkat et.
- Yazılan kodlar ve kod içi açıklamalar için İngilizce kullan. Projeler globalde kullanılabilir ve anlaşılabilir olmalı.
- Em dash ve en dash gibi karakterleri kullanma. Düzgün Türkçe ve İngilizce imla kurallarına göre metinler oluştur.
- Başlık ve alt başlıklarda kelimenin ilk harfi büyük, cümlelerin sonunda nokta gibi imla kurallarına uy.

## Kod Standartları
- Hata yönetimini unutma.
- Bir işin tamamlandığını söylemeden önce ilgili test, lint, typecheck veya build'i çalıştır. Çalıştıramadıysan bunu açıkça belirt, çalışmış gibi gösterme. Çok büyük bir iş değilse ve kullanıcı özellikle istemiyorsa her küçük adımı ayrı ayrı test etmek zorunda değilsin.
- Geçici ve yüzeysel çözümler yerine sorunun kök nedenini bul ve onu düzelt.
- Bir sistem için her zaman en güncel ve en stabil/güvenli sürümü kullan. Güncel sürümü gerekiyorsa internetten kontrol et.
- Hiçbir zaman arayüzde emoji kullanma. Emoji yerine uygun icon kütüphanelerini tercih et. Verimli ve akıllıca seçimler yaparak kullan.
- Bir materyal (örneğin bir düğme, liste, sayfa yapısı) başka bir yerde tekrar veya benzeri kullanılacaksa ortaklaştırmaya gayret göster. Eğer mümkünse arayüzde ve alt yapıda aynı veya benzer işler için gereksiz sıfırdan bir şey inşa etme.

## Git
- Yeni bir projeye başlanıyorsa ilk iş git init yap ve projeye uygun bir .gitignore ekle.
- Mevcut bir projeye devam ediliyorsa var olan branch, commit ve mesaj düzenine uyum sağla ve geçmiş tonda devam et.
- Commit mesajlarını düzgün, mantıklı ve teknik bir İngilizce ile yeterince (abartmadan) detaylı ve düzenli yaz.
- Ben açıkça istemedikçe commit, push, tag veya branch oluşturma. "Commit et" sadece commit demektir. "Push at" commit'leri ve varsa yeni tag'leri göndermek demektir (tag'ler ayrıca push edilir, unutma).
- Git işlemlerinde kendini gösterme. Co-Authored-By veya "Generated with" gibi satırlar ekleme. Gizli kal.

## Gizli Bilgiler ve .env
- .env dosyaları ve gizli bilgi içeren diğer dosyalar (anahtar, şifre, token, sertifika, özel anahtar dosyaları) git'e girmez; repo gizli olsa bile. Bu dosyalar her zaman .gitignore'dadır.
- Her projenin .env içeriğinin güncel kopyası Bitwarden'da "env / <proje adı>" adlı secure note içinde saklanır. Yeni bir cihazda veya sunucuda .env oradan alınıp proje köküne yapıştırılır. .env eksikse bana bunu hatırlat ve nasıl yapacağımı adım adım söyle; unutmuş olabilirim.
- .env'de bir değişiklik yaptığında (anahtar ekleme, silme, değer değiştirme) Bitwarden notu da güncellenmeli. Bunu asla unutma ve atlama. Bitwarden CLI oturumu açıksa (BW_SESSION tanımlıysa) notu kendin güncelle ve bana bildir. Açık değilse önce bana ne yapmam gerektiğini kopyalanabilir komutla net söyle ("bu terminalde export BW_SESSION=$(bw unlock --raw) çalıştır, master şifreni gir, sonra bana 'devam' de"), ben yapınca notu sen güncelle ve doğrula. Bunu yapmak istemezsem notun yeni içeriğini hazır ver ve Bitwarden uygulamasında hangi notu açıp nereye yapıştıracağımı adım adım anlat. Ben bu işin acemisiyim; varsayma, açıkça yönlendir.
- Her projede anahtar adlarını içeren, değerleri boş bir .env.example bulunur ve güncel tutulur.
- Bir projede düz metin .env veya başka gizli dosya git tarafından takip ediliyorsa bunu bana söyle ve bu düzene geçişi öner. Onaysız dosya silme veya git geçmişi temizleme yapma. Git geçmişindeki eski değerler için endişelenme; repo public yapılacaksa beni uyar, o zaman anahtarlar yenilenir.
- Gizli anahtarları, şifreleri ve token'ları commit mesajlarına, dokümantasyona, memory.md'ye, loglara veya terminal çıktısına gereksiz yere yazma.

## Sürümleme
- Semantic Versioning kullan: vMAJOR.MINOR.PATCH (örnek: v1.4.2).
  - PATCH: hata düzeltme, küçük iyileştirme.
  - MINOR: yeni özellik veya belirgin geliştirme.
  - MAJOR: geriye dönük uyumu bozan veya temel bir değişiklik. Onayım olmadan artırma; uygun görürsen öner ve onay al.
- Her commit sürüm artırmaz. Sürüm, anlamlı bir iş tamamlandığında artar. Bir işin sürüm çıkarmayı hak ettiğini düşünüyorsan öner. "Sürüm çıkar", "sürüm artır", "sürüm arttır", "sürüm yükselt" veya "release yap" dediğimde, cümlenin içinde geçse bile, bunu açık bir istek olarak anla ve uygula.
- PATCH mı MINOR mı olduğuna gerçekten küçük ve net olduğuna eminsen kendin karar ver ve bana bildir. Emin değilsen mutlaka sor. Yanlış olmamalı, ancak her seferinde de sormamalısın.
- Sürüm artışı tek bir release commit'i ile yapılır: sürüm kaynağı ve CHANGELOG.md aynı commit'te güncellenir, commit mesajı "Release vX.Y.Z" olur ve aynı commit'e "vX.Y.Z" adında annotated tag atılır. Bunu yalnızca commit izni verdiğimde yap.
- Sürüm numarası tek bir merkezde tutulur ve projenin ekosistemine uygun doğal yerdedir (örneğin package.json, composer.json, iOS için MARKETING_VERSION, aksi halde bir VERSION dosyası). Kullanıcının ve/veya admin'in göreceği uygun yerlerde (footer, hakkında/ayarlar ekranı, admin panel, varsa API) sürüm bu merkezden okunarak gösterilir; hiçbir yere elle yazılmaz.
- CHANGELOG.md, her sürümün altında ne değiştiğini kısa maddelerle tutar. En yeni sürüm en üsttedir.
- Mevcut bir projede sürümleme yoksa eklenmesini öner ve onay al; kendiliğinden başlatma.

## Genel Kurallar
- Dosya değiştirmeden önce mevcut yapıyı analiz et.
- Temiz ve okunabilir kod yaz.
- İhtiyaç duyulandan gereksiz ve karmaşık yapı kurmamaya dikkat et.
- Olası güvenlik açıklarına dikkat et.
- Büyük değişiklikler için önce detaylı bir plan sun ve onay al.
- Sistem, ağ, servis, veri veya geri dönüşü zor işlemleri etkileyen terminal komutlarını çalıştırmadan önce ne yapacağını açıkla. Sıradan ve güvenli komutlar için açıklama gerekmez.
- Bir hata yapıp düzeltildiğinde, aynı hatanın tekrarlanmaması için CLAUDE.md'ye kısa bir kural eklemeyi öner. Koddan çıkarılabilecek şeyleri CLAUDE.md'ye yazma.

## Dokümantasyon
- Amaç: sen, başka bir session'daki sen veya başka bir kişi dokümantasyonu okuduğunda projeye yüzde yüz hakim olabilmeli.
- Dokümantasyonu projenin büyüklüğüne uygun tut; küçük bir script için ağır dokümantasyon üretme.
- Projenin yapısını architecture.md olarak depola. Kendin çalışmak ve çalışacak başkaları için projenin kolay anlaşılabilmesini sağla.
- API varsa endpoint'ler için detaylı api.md yaz.
- Veritabanı yapısı için detaylı database.md yaz.
- Gerekiyorsa kurulum ve kullanım adımlarını Türkçe ve İngilizce dokümante et.

## Memory Dosyası
- Yaptığın önemli işlemleri ve önemli kararları memory.md dosyasında tut. İşlemler öncesinde bu dosyayı kontrol et, işlemler sonrasında gerekli ekleme ve güncellemeleri yap. Amacın daha sonra önemli şeyleri hatırlayabilmek ve hata olasılığını azaltmaktır.
- Sonra gerekli olma potansiyeline sahip hiçbir şeyi memory.md dosyasından silme. Amacın hatırlanacak yeni bilgileri eklemek ve mevcut bilgiler değiştiyse düzenlemektir, temizlemek değil. Tamamlanmış ve artık aktif olmayan konuları silmek yerine dosyanın altındaki "Arşiv" başlığına taşı.
- Maddeleri kısa ve tarihli yaz ki dosya okunabilir kalsın.
- Yeni bir Session'a başladığında memory.md'ni gözden geçir ve projeye en son Session'da kaldığımız yerden devam edebilmek üzere hakim ol.

## Paydos Etmek
- Paydos etmek, mevcut session'un kullanıcı tarafından kapatılacağı anlamına gelir.
- Mevcut session kapanmadan önce kullanıcı yeni bir session açtığında aynen devam edebilmek için projeye dair gerekli önemli ve detay bilgilerin en son güncellenmesi ve saklanması gerekir.
- Paydos'ta git durumunu da toparla: commit edilmemiş değişiklik, push edilmemiş commit, tag'i atılmamış release veya push edilmemiş tag var mı kontrol et ve bana kısa bir liste halinde bildir. Bu session'da ne yaptığımızı ve yarım kalan işleri özetle. İzinsiz commit veya push yapma; sadece raporla ve gerekiyorsa öner.
- Paydos'ta .env kontrolü de yap: bu session'da herhangi bir .env veya gizli dosya değiştiyse Bitwarden'daki ilgili notun güncel olup olmadığını kontrol et. Güncel değilse yukarıdaki Gizli Bilgiler ve .env kuralına göre güncelle veya bana ne yapacağımı net söyle. Session'u bu iş kapanmadan bitirme.
- "Paydos", bir sohbete kaldığımız yerden devam etmek için değil, en son yaptıklarımızı son kez güncellemek ve eksik kalmamasını sağlamak için kullanılır.

## Proje
- Bu dosya genel kuralları içerir. Projeye özel build, test ve çalıştırma komutlarını, klasör yapısını ve dokunulmaması gereken alanları bu başlığın altına yaz. Bu başlık boşsa ilk oturumda projeyi inceleyip doldurmayı öner.
