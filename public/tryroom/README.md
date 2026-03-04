# Try in My Room - LuxMobila

Funcționalitate AR (Augmented Reality) fără biblioteci 3D - folosește Canvas API și MediaDevices API.

## 🎯 Funcționalități

### 1. Captură Imagine
- **Camera Live**: Deschide camera dispozitivului (front/back)
- **Upload Imagine**: Încarcă o poză existentă a camerei tale
- **Switch Camera**: Comută între camera frontală și cea din spate

### 2. Modul Editare
- **Snapshot**: Îngheață cadrul pe canvas
- **Add Furniture**: Selectează produse din drawer
- **Manipulare Obiecte cu Handle-uri Vizuale**:
  - **Selecție**: Click/tap pe produs pentru a-l selecta și a vedea handle-urile
  - **Bounding Box**: Cadru portocaliu cu 8 handle-uri albe (4 colțuri + 4 laturi)
  - **Resize**: Drag pe handle-urile albe pentru redimensionare
    - Colțuri: Scalare proporțională
    - Laturi: Scalare pe axa respectivă
  - **Rotire**: Drag pe handle-ul verde circular (deasupra obiectului)
  - **Mutare**: Drag pe interiorul obiectului
  - **Desktop**: 
    - Mouse Wheel = Zoom (scale) rapid
    - Shift + Mouse Wheel = Rotire rapidă
  - **Mobile**:
    - 1 deget = Mutare / Drag handle-uri
    - 2 degete pinch = Zoom și rotire simultană

### 3. Management Obiecte
- Click pe obiect = Selectare + Bring to Front
- **Selecția persistă** după transformări (drag/scale/rotate)
- Deselect = Click pe zonă goală
- Butoane control:
  - 🗑️ **Șterge**: Șterge obiectul selectat
  - ⬆️ **Bring Forward**: Mută un strat în față
  - ⬇️ **Send Backward**: Mută un strat în spate  
  - 🔄 **Reset Transform**: Resetează scale și rotație la valorile inițiale
- Multiple layere (ultimul adăugat = top layer)

### 4. Export
- Buton "Export" = Descarcă imaginea finală ca PNG
- Include background + toate obiectele cu transformările aplicate

## 📁 Structură Fișiere

```
public/tryroom/
├── index.html    # UI Structure
├── style.css     # Dark Premium Theme
└── app.js        # Canvas Logic + API Integration
```

## 🚀 Cum Rulezi

### Opțiunea 1: Prin Server Development (Recomandat)
Aplicația este deja integrată în server!

1. **Serverul rulează deja** la:
   - `https://192.168.1.2:5173/`
   
2. **Accesează Try in My Room**:
   - Click pe "Try in My Room" în header
   - SAU direct la: `https://192.168.1.2:5173/tryroom/index.html`

### Opțiunea 2: Standalone (fără React)
```bash
# Navighează la directorul public
cd "Mobila 1/public/tryroom"

# Pornește un server HTTP simplu (Python)
python -m http.server 8080

# SAU cu Node.js (dacă ai npx)
npx http-server -p 8080

# Accesează în browser
# http://localhost:8080
```

⚠️ **IMPORTANT**: Camera NU funcționează pe `file://` protocol! Trebuie să folosești un server HTTP/HTTPS.

## 🎨 Design

### Dark Premium Theme
- Background: `#0a0a0a` (primary), `#1a1a1a` (secondary)
- Accent: `#c19a6b` (gold)
- Shadows: Blur subtil pentru depth
- Rounded corners: 12-24px
- Smooth animations: 0.3s cubic-bezier

### Responsive
- Mobile-first approach
- Drawer glisează de jos pe mobile
- Touch gestures optimizate
- Grid adaptiv pentru produse

## 🔧 Cerințe Tehnice

### Browser Support
- Chrome/Edge: ✅ Full support
- Safari: ✅ Full support (iOS 11+)
- Firefox: ✅ Full support

### Permissions Needed
- **Camera Access**: Pentru live preview
- **Storage Access**: Pentru upload imagine (automat)

### Imagini Produse
Aplicația folosește imaginile produselor din server (`products.json`).

**Optimizări recomandate**:
- Format: PNG/WebP cu fundal transparent
- Dimensiuni: Max 1000x1000px
- Mărime: < 300KB per imagine
- Decupare precisă (fără fundal alb/colored)

## 📱 Flow de Utilizare

1. **Start** → Permite acces camera SAU încarcă imagine
2. **Capture** → Apasă "Fă poză" (snapshot)
3. **Edit** → Deschide drawer "Adaugă mobilă"
4. **Select** → Click pe produse pentru a le adăuga
5. **Arrange** → Drag, scale, rotate produsele
6. **Export** → Descarcă imaginea finală

## 🐛 Troubleshooting

### Camera nu se deschide
- Verifică permisiunile browser (Settings > Privacy)
- Asigură-te că rulezi pe HTTPS sau localhost
- Încercă să încarci o imagine în loc

### Produsele nu se încarcă
- Verifică că serverul backend rulează (port 3001)
- Verifică console pentru erori API
- Endpoint: `http://192.168.1.2:3001/api/products`

### Pinch zoom nu funcționează
- Asigură-te că folosești 2 degete simultan
- Verifică că obiectul este selectat (border gold)

### Export nu descarcă
- Verifică permisiunile de download în browser
- Unele browsere blochează download automat

## 🎯 Performance Tips

- Canvas render optimizat (doar când e nevoie)
- Lazy loading pentru imagini produse
- Touch events debounced
- Object detection eficient (reverse iteration)

## 🔐 Security

- CORS enabled pentru API requests
- crossOrigin="anonymous" pentru imagini
- No server-side storage (all client-side)
- Export works offline după captură

## 📞 Support

Pentru probleme sau sugestii, contactează echipa LuxMobila!

---

**Versiune**: 1.0.0  
**Data**: 2026-02-05  
**Tehnologie**: Vanilla JS + Canvas API + MediaDevices API
