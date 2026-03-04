# Ce poate încetini site-ul (și ce poți scoate)

## 1. **Imaginea hero (Home)**
- **Ce:** `images/IMG_9859.JPG` – dacă e foarte mare (ex. 2–5 MB), întârzie prima încărcare.
- **Ce poți face:** Redimensionează/optimizează (ex. max 1600px lățime, calitate 80%) sau convertește la WebP. Poți folosi [Squoosh](https://squoosh.app) sau un script de build.

## 2. **Animații (Framer Motion)**
- **Ce:** Multe componente `<motion.div>` pe Home (hero, colecții, testimoniale) + `useInView`.
- **Efect:** Puțin mai mult JavaScript și calcule la scroll/animații.
- **Ce poți scoate:** Poți înlocui cu CSS (transition, opacity). Dacă vrei mai puțin lag, putem reduce numărul de animații sau durata lor.

## 3. **Fonturi Google (Inter + Playfair Display)**
- **Ce:** Două familii încărcate din Google Fonts în `index.html`.
- **Efect:** Request-uri în plus la prima încărcare; textul poate „sărit” când se încarcă fontul.
- **Ce poți face:** Adaugă `&display=swap` în URL (dacă nu e deja) ca textul să apară mai repede cu font de rezervă.

## 4. **Imagini externe (Unsplash)**
- **Ce:** Pe Home, secțiunile Colecții și Testimoniale folosesc imagini de pe Unsplash (URL-uri externe).
- **Efect:** Mai multe request-uri, depinde de rețea.
- **Ce poți face:** Dacă vrei, poți înlocui cu imagini locale (optimizate) sau cu CDN.

## 5. **API-ul de galerie**
- **Ce:** La Home se apelează `getAllProducts()` (galerie), la Galerie se apelează galeria + categorii.
- **Efect:** Dacă serverul e lent sau rețeaua slabă, paginile par lente.
- **Ce poți face:** Asigură-te că serverul Node rulează local sau pe un host rapid; poți adăuga cache pe client (ex. revalidare la 1 min).

## 6. **Try in my room**
- **Ce:** Pagina are logică și resurse mai grele (canvas, drag, imagini).
- **Efect:** Doar când intri pe acea pagină; nu afectează Home/Galerie direct.
- **Ce poți face:** Poți dezactiva din Setări admin dacă nu e folosit.

## Rezumat – ce poți decide să scoți
| Element            | Încetinește? | Poți scoate / reduce?        |
|--------------------|-------------|------------------------------|
| Imagine hero mare  | Da          | Da – optimizează imaginea    |
| Animații Framer   | Puțin       | Da – le putem reduce/simplifica |
| Fonturi Google    | Puțin       | Da – display=swap sau font local |
| Imagini Unsplash  | Depinde     | Da – înlocuiești cu locale    |
| API galerie       | Depinde     | Nu – necesar; îmbunătățești serverul |
| Try in my room    | La acea pagină | Da – dezactivare din setări |

După ce decizi ce vrei scos (ex. „fără animații pe hero” sau „doar optimizare imagini”), se pot face modificările în cod.
