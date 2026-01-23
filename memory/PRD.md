# HomeDeco - AI Destekli Ev Ürünleri Platformu

## Orijinal Problem Statement
Avrupa pazarı için kişiselleştirilmiş ev ürünleri (dolap, kapı, mermer tezgah, mobilya) satışı yapan AI destekli e-ticaret platformu. Müşteriler AI asistanı kullanarak (metin + ses + görsel) istedikleri ürünü tarif eder, fotoğraf yükleyebilir, AI ürünü anlar ve seçenekler sunar. Türkiye'de üretim, Avrupa'ya teslimat.

## Hedef Kitle (User Personas)
1. **Avrupa'daki Ev Sahipleri**: Almanya, Hollanda, Belçika'da yaşayan, kalite arayan, DIY kültürüne sahip müşteriler
2. **Türk Diasporası**: Avrupa'daki Türk kökenli aileler
3. **İç Mimarlar / Tasarımcılar**: Müşterileri için özel ürün arayan profesyoneller

## Temel Gereksinimler
- 6 dil desteği (Almanca, İngilizce, Türkçe, Fransızca, Arapça, Hollandaca)
- AI Chat Asistan (metin + ses + görsel yükleme)
- Ürün Kategorileri: Dolap, Kapı, Tezgah, Mobilya, Pencere
- Otomatik fiyat hesaplama (ölçü + malzeme bazlı)
- Stripe Escrow ödeme sistemi
- Admin paneli (sipariş/üretim takibi)
- DIN Avrupa standartlarına uygunluk

## Uygulanan Özellikler (Ocak 2025)
### Backend (FastAPI + MongoDB)
- [x] Ürün kategorileri API'si
- [x] Malzeme listesi API'si
- [x] Otomatik fiyat hesaplama
- [x] AI Chat API (GPT-4o + görsel analiz)
- [x] Sipariş oluşturma ve yönetimi
- [x] Stripe ödeme entegrasyonu
- [x] Admin dashboard istatistikleri
- [x] Sipariş durumu güncelleme

### Frontend (React + Tailwind)
- [x] Lüks koyu tema tasarımı
- [x] 6 dil desteği (i18n)
- [x] Ana sayfa (Hero + Kategoriler + Güven rozetleri)
- [x] Ürün yapılandırıcı
- [x] AI Asistan sayfası
- [x] Sepet ve ödeme akışı
- [x] Admin paneli

## Backlog (P0/P1/P2)
### P0 - Kritik
- [ ] Gerçek Stripe hesabı entegrasyonu
- [ ] Kullanıcı kimlik doğrulama sistemi
- [ ] E-posta bildirimleri

### P1 - Önemli
- [ ] PayPal ödeme entegrasyonu
- [ ] Sipariş takip sayfası (müşteri için)
- [ ] Üretim fotoğrafları yükleme (admin)
- [ ] Sesli komut entegrasyonu (Web Speech API)

### P2 - İyileştirmeler
- [ ] 3D ürün önizleme
- [ ] Fiyat teklifi PDF oluşturma
- [ ] Mobil uygulama
- [ ] CRM entegrasyonu

## Teknik Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Motor (MongoDB async)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o (Emergent LLM Key)
- **Ödeme**: Stripe (Escrow)
- **Diller**: 6 dil (DE, EN, TR, FR, AR, NL)

## Test Durumu
- Backend: %94.4 başarılı
- Frontend: %85 başarılı
- AI Chat: Çalışıyor
- Ödeme: Test modu aktif
