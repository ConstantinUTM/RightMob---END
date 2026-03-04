# Sistem de Contact - Documentație

## 📋 Prezentare Generală

Acest sistem oferă funcționalități complete de contact pentru website, incluzând:
- Informații de contact în header, footer și pagina de contact
- Butoane flotante WhatsApp și Viber
- Formular de contact funcțional
- Integrare cu rețelele sociale

## 🚀 Configurare Inițială

### 1. Configurare Variabile de Mediu

Copiază fișierul `.env.example` ca `.env` și completează cu datele tale:

```bash
cp .env.example .env
```

Editează fișierul `.env` cu informațiile tale reale:

```env
VITE_COMPANY_EMAIL=contact@rightmob.md
VITE_COMPANY_PHONE=+373 XX XX XX XX
VITE_COMPANY_ADDRESS=Chișinău, Moldova
VITE_COMPANY_SCHEDULE=Lu - Sâm: 09:00 - 18:00

VITE_WHATSAPP_NUMBER=373XXXXXXXX
VITE_VIBER_NUMBER=373XXXXXXXX
VITE_INSTAGRAM_URL=https://instagram.com/your_username
VITE_FACEBOOK_URL=https://facebook.com/your_page
```

**IMPORTANT**: 
- Pentru WhatsApp și Viber, folosește formatul: `373XXXXXXXX` (cod țară fără +)
- Înlocuiește XXXXXXXX cu numerele tale reale

### 2. Restart Development Server

După modificarea fișierului `.env`, restartează serverul de dezvoltare:

```bash
# Oprește serverul (Ctrl+C)
# Pornește din nou
npm run dev
```

## 📍 Locațiile Componentelor

### 1. Header
- **Fișier**: `src/components/Header.tsx`
- **Afișare**: Email + 4 iconițe sociale (WhatsApp, Viber, Instagram, Facebook)
- **Responsive**: Pe desktop mare (XL) afișează email complet, pe mobile doar iconițele

### 2. Footer
- **Fișier**: `src/components/Footer.tsx`
- **Afișare**: Telefon, Email, Adresă, Program + 3 iconițe sociale (WhatsApp, Instagram, Facebook)
- **Link-uri**: Toate link-urile sunt clickabile (telefon, email, maps)

### 3. Butoane Flotante
- **Fișier**: `src/components/FloatingButtons.tsx`
- **Poziție**: Colț dreapta jos, fixed position
- **Butoane**: WhatsApp (verde) și Viber (mov)
- **Animație**: Efect de plutire (float) continuu

### 4. Pagina Contact
- **Fișier**: `src/pages/ContactPage.tsx`
- **Secțiuni**:
  - 4 carduri info: Telefon, Email, Adresă, Program
  - Formular de contact funcțional
  - 4 butoane sociale mari: WhatsApp, Viber, Instagram, Facebook

## 🎨 Stiluri CSS

Toate stilurile sunt în `src/index.css` și includ:

### Clase CSS Principale:

1. **Social Icons Header**: `.social-icon-header`
   - Hover effects cu culori specifice fiecărei platforme
   - WhatsApp: #25D366
   - Viber: #665CAC
   - Instagram: gradient roz-portocaliu
   - Facebook: #1877F2

2. **Social Icons Footer**: `.social-icon-footer`
   - Similar cu header, adaptat pentru fundal întunecat

3. **Floating Buttons**: `.floating-button`
   - Animație float cu keyframe
   - Shadow effects on hover

4. **Social Cards**: `.social-card`
   - Carduri mari pe pagina de contact
   - Transform și scale pe hover
   - Gradient background specific fiecărei platforme

## 🔧 API Endpoints

### GET /api/contact/info
Returnează toate informațiile de contact din .env

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "contact@rightmob.md",
    "phone": "+373 XX XX XX XX",
    "address": "Chișinău, Moldova",
    "schedule": "Lu - Sâm: 09:00 - 18:00",
    "whatsapp": "373XXXXXXXX",
    "viber": "373XXXXXXXX",
    "instagram": "https://instagram.com/...",
    "facebook": "https://facebook.com/..."
  }
}
```

### POST /api/contact/submit
Salvează mesajul din formularul de contact în `server/messages.json`

**Request Body:**
```json
{
  "fullName": "Ion Popescu",
  "email": "ion@example.com",
  "phone": "+373 69 123 456",
  "message": "Mesajul meu..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mesajul a fost trimis cu succes!",
  "data": { "id": "1234567890" }
}
```

## 📱 Funcționalități Link-uri

### Telefon
```tsx
<a href="tel:+37369123456">+373 69 123 456</a>
```

### Email
```tsx
<a href="mailto:contact@rightmob.md">contact@rightmob.md</a>
```

### WhatsApp
- Desktop: `https://wa.me/373XXXXXXXX`
- Mobile: `whatsapp://send?phone=373XXXXXXXX`

### Viber
```tsx
<a href="viber://chat?number=%2B373XXXXXXXX">Contact Viber</a>
```

### Google Maps
```tsx
window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank')
```

## 🎯 Testare

### Desktop
1. Verifică afișarea email și iconițelor în header
2. Hover pe iconițe - trebuie să vadă efecte de culoare
3. Butoane flotante în colțul dreapta jos
4. Footer cu toate informațiile

### Mobile
1. Email text ascuns în header, doar iconița
2. Butoane flotante mai mici
3. Menu responsive
4. Carduri sociale stack vertical pe Contact Page

## 🔍 Verificare Funcționalitate

### 1. Link-uri Clickabile
- ✅ Click pe telefon → deschide dialer
- ✅ Click pe email → deschide client email
- ✅ Click pe adresă → deschide Google Maps
- ✅ Click WhatsApp → deschide WhatsApp
- ✅ Click Viber → deschide Viber
- ✅ Click Instagram → deschide profil Instagram
- ✅ Click Facebook → deschide pagină Facebook

### 2. Formular Contact
- ✅ Validare câmpuri obligatorii
- ✅ Validare format email
- ✅ Salvare în `server/messages.json`
- ✅ Mesaje success/error

## 🐛 Troubleshooting

### Link-urile nu funcționează?
- Verifică că ai completat corect .env
- Verifică că ai restartat serverul după modificarea .env

### Butoanele flotante nu apar?
- Verifică că FloatingButtons este importat în App.tsx
- Verifică z-index (ar trebui să fie 50)

### Stilurile nu se aplică?
- Verifică că index.css este importat în main.tsx
- Run `npm run dev` pentru a recompila

### WhatsApp/Viber nu se deschid?
- Verifică că aplicațiile sunt instalate pe dispozitiv
- Pe desktop, WhatsApp Web trebuie să fie configurat

## 📝 Notițe Importante

1. **Numerele de telefon**: 
   - În .env folosește formatul: `373XXXXXXXX` (fără +)
   - În display se va afișa cu +: `+373 XX XX XX XX`

2. **Responsive Design**:
   - Header email vizibil doar pe XL screens (2xl:inline)
   - Social icons în header vizibile doar pe XL (xl:flex)
   - Butoane flotante mai mici pe mobile

3. **Animații**:
   - Float animation pentru butoane flotante (3s infinite)
   - Hover effects cu transform și scale
   - Smooth transitions (300ms)

4. **Culori Specifice**:
   - WhatsApp: #25D366
   - Viber: #665CAC
   - Instagram: gradient (#405DE6 → #E1306C → #FFDC80)
   - Facebook: #1877F2

## ✅ Checklist Final

- [ ] Completat .env cu date reale
- [ ] Restartat development server
- [ ] Testat toate link-urile de contact
- [ ] Verificat butoanele flotante
- [ ] Testat formularul de contact
- [ ] Verificat responsive pe mobile
- [ ] Testat hover effects
- [ ] Verificat funcționalitatea WhatsApp/Viber

---

Pentru suport sau întrebări, contactați echipa de dezvoltare.
