# Specyfikacja: Wirtualna Tablica do Nauczania Matematyki

## 1. Przegląd Projektu

### 1.1 Cel
Stworzenie webowej aplikacji do prowadzenia lekcji matematyki online, umożliwiającej współdzielenie tablicy w czasie rzeczywistym między nauczycielem a uczniami. Inspiracja: Idroo, Google Jamboard.

### 1.2 Kluczowe Założenia
- Aplikacja webowa (fullscreen w przeglądarce)
- Real-time collaboration (1 nauczyciel + 1-kilku uczniów)
- Duża, ale nie ogromna tablica z wydajnym renderowaniem
- Dostęp dla uczniów przez unikalny link (bez logowania)
- Konto nauczyciela z przechowywaniem tablic
- Intuicyjna obsługa ze skrótami klawiaturowymi

---

## 2. Architektura Systemu

### 2.1 Stack Technologiczny

#### Frontend
- **Framework:** React 18+
- **Canvas/Rysowanie:** Fabric.js (manipulacja obiektami 2D)
- **Real-time:** Socket.io Client
- **Routing:** React Router
- **State Management:** React Context API + useReducer (lub Zustand)
- **PDF Handling:** pdf.js (Mozilla)
- **Styling:** Tailwind CSS lub CSS Modules

#### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (dane strukturalne)
- **File Storage:** AWS S3 / MinIO / lokalne storage (obrazy, PDF)
- **Real-time:** Socket.io Server
- **Authentication:** JWT tokens (dla nauczyciela)
- **PDF Processing:** pdf-lib lub pdf.js

#### Deployment (sugestia)
- **Frontend:** Vercel/Netlify
- **Backend:** Railway/Render/VPS
- **Database:** PostgreSQL managed service

---

## 3. Modele Danych

### 3.1 Baza Danych - PostgreSQL

#### Tabela: `teachers`
```sql
id                UUID PRIMARY KEY
email             VARCHAR(255) UNIQUE NOT NULL
password_hash     VARCHAR(255) NOT NULL
name              VARCHAR(100)
created_at        TIMESTAMP DEFAULT NOW()
```

#### Tabela: `boards`
```sql
id                UUID PRIMARY KEY
teacher_id        UUID REFERENCES teachers(id) ON DELETE CASCADE
title             VARCHAR(255) NOT NULL
share_token       VARCHAR(64) UNIQUE NOT NULL  -- dla linku ucznia
background_type   VARCHAR(20) DEFAULT 'plain'  -- plain, grid, lines, color
background_color  VARCHAR(7) DEFAULT '#FFFFFF'
thumbnail_url     TEXT  -- miniaturka tablicy
canvas_data       JSONB  -- serializowany stan Fabric.js Canvas
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
is_active         BOOLEAN DEFAULT TRUE
```

#### Tabela: `board_files` (opcjonalnie dla PDF/obrazów)
```sql
id                UUID PRIMARY KEY
board_id          UUID REFERENCES boards(id) ON DELETE CASCADE
file_type         VARCHAR(10)  -- pdf, image
file_url          TEXT NOT NULL
file_name         VARCHAR(255)
uploaded_at       TIMESTAMP DEFAULT NOW()
```

### 3.2 Struktura Canvas Data (JSONB)

```json
{
  "version": "5.3.0",
  "objects": [
    {
      "type": "path",
      "stroke": "#000000",
      "strokeWidth": 2,
      "path": [...],
      "selectable": false
    },
    {
      "type": "image",
      "src": "https://...",
      "left": 100,
      "top": 100,
      "scaleX": 0.5,
      "scaleY": 0.5
    },
    {
      "type": "polygon",
      "points": [...],
      "fill": "transparent",
      "stroke": "#FF0000"
    }
  ],
  "background": "#FFFFFF"
}
```

---

## 4. Funkcjonalności - Szczegółowa Specyfikacja

### 4.1 Panel Nauczyciela

#### 4.1.1 Autentykacja
- **Rejestracja:** email + hasło (min. 8 znaków)
- **Logowanie:** JWT token, refresh token
- **Session:** Token przechowywany w localStorage/httpOnly cookie

#### 4.1.2 Dashboard Nauczyciela
**Widok listy tablic:**
- Grid/lista wszystkich tablic
- Miniaturki tablic (thumbnail generowany przy zapisie)
- Tytuł tablicy, data ostatniej modyfikacji
- Akcje: Otwórz, Edytuj nazwę, Usuń, Skopiuj link
- Przycisk: "+ Nowa tablica"

**Zarządzanie tablicami:**
- Tworzenie nowej tablicy (modal z nazwą)
- Usuwanie tablicy (potwierdzenie)
- Edycja nazwy tablicy
- Sortowanie: ostatnio modyfikowane, alfabetycznie
- Search/filtrowanie po nazwie

#### 4.1.3 Generowanie Linku dla Ucznia
- Po utworzeniu tablicy → automatyczny unikalny token
- Format linku: `https://app.com/board/{share_token}`
- Przycisk "Skopiuj link" w dashboardzie i w edytorze tablicy
- Link nie wymaga autoryzacji - każdy z linkiem może edytować

---

### 4.2 Edytor Tablicy (Main Canvas Interface)

#### 4.2.1 Layout
```
+----------------------------------------------------------+
|  [Logo] [Tytuł tablicy]            [Udostępnij] [Export]|
+----------------------------------------------------------+
|T|                                                      |S||
|o|                                                      |i||
|o|                                                      |d||
|l|           CANVAS AREA                                |e||
|b|           (infinite scrollable)                      |b||
|a|                                                      |a||
|r|                                                      |r||
| |                                                      | ||
+----------------------------------------------------------+
|  [Zoom: -][100%][+]  [Undo][Redo]  [Users: 3]          |
+----------------------------------------------------------+
```

**Toolbar (lewa strona):**
- Vertical layout
- Ikony narzędzi z tooltipami
- Aktywne narzędzie = highlight

**Sidebar (prawa strona - collapsible):**
- Ustawienia aktywnego narzędzia
- Panel kolorów
- Panel kształtów
- Panel plików

---

### 4.3 Narzędzia Rysowania

#### 4.3.1 Pisaki (Drawing Tools)

**Typy pisaków:**
1. **Ołówek (Pencil)** - cienka linia, lekko transparentna, symulacja ołówka
2. **Długopis (Pen)** - gładka, równa linia
3. **Pędzel (Brush)** - gruba linia z teksturą, variable width
4. **Pióro (Marker)** - średnia grubość, intensywny kolor
5. **Zakreślacz (Highlighter)** - szeroka, transparentna linia (alpha ~0.3)

**Parametry pisaka:**
- Kolor (color picker)
- Grubość (1-50px, slider)
- Opacity (dla highlightera)
- Smoothing (wygładzanie linii)

**Implementacja w Fabric.js:**
- Użyj `fabric.PencilBrush`
- Custom brush classes dla różnych efektów
- `canvas.isDrawingMode = true` dla trybu rysowania
- `canvas.freeDrawingBrush` - konfiguracja aktywnego pisaka

#### 4.3.2 Gumka (Eraser)
- Tryby:
  - **Erase path:** usuwa całe ścieżki rysowania
  - **Erase pixel:** "wyciera" piksele (wymaga hack w Fabric.js - rysowanie białą linią lub destination-out)
- Rozmiar gumki (slider 10-100px)

#### 4.3.3 Zaznaczanie/Selekcja (Selection Tool)
- Domyślny tryb = selection mode
- Zaznaczanie pojedynczego obiektu (klik)
- Multi-select (Shift + klik lub marquee selection)
- Drag & drop obiektów
- Resize handles (8 punktów)
- Rotation handle
- Delete zaznaczonego: Delete/Backspace

---

### 4.4 Linie i Kształty

#### 4.4.1 Linia Prosta
**Typy linii:**
- Ciągła (solid)
- Przerywana (dashed) - pattern: [10, 5]
- Kropkowana (dotted) - pattern: [2, 5]
- Kreska-kropka (dash-dot) - pattern: [10, 5, 2, 5]

**Opcje:**
- Kolor
- Grubość (1-10px)
- Strzałki na końcach (opcjonalnie)

**Rysowanie:**
- Klik = punkt startowy
- Przeciągnięcie = punkt końcowy
- Shift = blokada do kąta 45° (pozioma/pionowa/ukośna)

#### 4.4.2 Podstawowe Kształty
**Dostępne kształty:**
- Prostokąt (Rectangle)
- Kwadrat (Square) - Shift podczas rysowania prostokąta
- Koło (Circle)
- Elipsa (Ellipse)

**Parametry:**
- Kolor wypełnienia (fill) + opcja "bez wypełnienia"
- Kolor obramowania (stroke)
- Grubość obramowania
- Opacity

**Interakcja:**
- Drag to draw
- Po stworzeniu: przesuwalne, skalowalne, obracalne
- Opcja "przypięcia" = `lockMovementX/Y = true, selectable = false`

#### 4.4.3 Kształty Geometryczne (dla matematyki)

**Wielokąty regularne:**
- Trójkąt równoboczny
- Kwadrat (już jest)
- Pięciokąt
- Sześciokąt
- Ośmiokąt

**Wielokąty specjalne:**
- Równoległobok (Parallelogram)
- Trapez (Trapezoid)
- Romb (Rhombus)
- Deltoid (Kite)

**Implementacja:**
- Fabric.js Polygon z wyliczonymi punktami
- Generator punktów dla każdego kształtu (funkcje matematyczne)
- Możliwość edycji punktów (opcjonalnie w późniejszej fazie)

**UI:**
- Panel "Kształty" w sidebarze
- Grid ikon kształtów
- Klik → wybór kształtu → rysowanie na canvas

#### 4.4.4 Układ Współrzędnych

**Specyfikacja:**
- Prosty, statyczny układ kartezjański (XY)
- Parametry:
  - Zakres X: od ... do ... (np. -10 do 10)
  - Zakres Y: od ... do ... (np. -10 to 10)
  - Podziałka: co ile jednostek linie (np. co 1)
  - Siatka pomocnicza: włącz/wyłącz
  - Grubość osi
  - Kolor osi i siatki

**Renderowanie:**
- Grupa obiektów Fabric.js (Group)
- Linie dla osi X i Y
- Podziałki (krótkie linie prostopadłe)
- Etykiety liczbowe (Text objects)
- Po dodaniu = obiekt moveable, scalable

**UI:**
- Przycisk "Dodaj układ współrzędnych" w sidebarze
- Modal z ustawieniami przed dodaniem
- Domyślne wartości: -10 do 10, podziałka co 1

#### 4.4.5 Bryły 3D (opcjonalnie - późniejsza faza)
**Uproszczone 2D reprezentacje:**
- Sześcian (perspektywa izometryczna)
- Prostopadłościan
- Walec
- Stożek
- Piramida
- Kula (koło z cieniowaniem)

**Implementacja:**
- Pre-rendered SVG lub generowane linie
- Fabric.js Group
- Tylko wizualne, nie interaktywne 3D

---

### 4.5 Wklejanie i Upload Plików

#### 4.5.1 Wklejanie Screenshotów (Ctrl+V)

**Flow:**
1. Użytkownik robi screenshot (Print Screen, Shift+Win+S, etc.)
2. Naciśnięcie Ctrl+V na tablicy
3. Przechwycenie clipboard event
4. Odczyt obrazu z clipboard (Clipboard API)
5. Upload obrazu do storage
6. Dodanie obrazu na canvas w pozycji środka ekranu

**Implementacja:**
```javascript
// Event listener
document.addEventListener('paste', handlePaste);

function handlePaste(e) {
  const items = e.clipboardData.items;
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      // Upload + add to canvas
    }
  }
}
```

**Optymalizacja:**
- Auto-resize jeśli > 2000px (max dimension)
- Kompresja do JPEG 85% quality
- Max rozmiar pliku: 10MB

#### 4.5.2 Upload PDF

**UI:**
- Przycisk "Upload PDF" w toolbarze
- Modal z:
  - File picker
  - Preview wszystkich stron (thumbnails)
  - Checkboxy do wyboru stron
  - Przycisk "Dodaj zaznaczone strony"

**Flow:**
1. Użytkownik wybiera PDF (max 20MB)
2. Backend parsuje PDF → generuje obrazy każdej strony (pdf.js)
3. Zwrócenie listy URL-i obrazów stron
4. Użytkownik wybiera strony
5. Wybrane strony dodawane na canvas jako obrazy

**Implementacja backendu:**
- Endpoint: `POST /api/boards/:id/upload-pdf`
- Parsowanie PDF przez pdf.js lub pdf-lib
- Renderowanie każdej strony do Canvas → PNG
- Upload PNG-ów do storage
- Zwrócenie array URL-i

**Rozmieszczenie na tablicy:**
- Strony dodawane w siatce 2-3 kolumny
- Lub pionowo jedna pod drugą
- Użytkownik może później przesuwać/skalować

#### 4.5.3 Upload Obrazów (PNG/JPG)
- Przycisk "Upload Image"
- Drag & drop na canvas
- Formaty: PNG, JPG, JPEG, GIF, WebP
- Max rozmiar: 10MB
- Auto-resize jak przy clipboard

---

### 4.6 Tła Tablicy

#### 4.6.1 Typy Tła

**1. Plain (jednolity kolor)**
- Domyślnie: biały (#FFFFFF)
- Color picker do wyboru koloru

**2. Grid (siatka)**
- Siatka kwadratów
- Parametry:
  - Rozmiar komórki (20px, 40px, 60px)
  - Kolor linii siatki (#CCCCCC)
  - Grubość linii (1px)

**3. Lines (linie)**
- Poziome linie (jak w zeszycie)
- Parametry:
  - Odstęp między liniami (30px, 40px, 50px)
  - Kolor linii (#E0E0E0)
  - Opcjonalnie: linia marginalna (pionowa) po lewej

**4. Dots (kropki)**
- Siatka kropek
- Parametry:
  - Odstęp między kropkami (20px, 40px)
  - Rozmiar kropki (2px)
  - Kolor (#BBBBBB)

**Implementacja:**
- Fabric.js `canvas.backgroundColor` dla plain
- Pattern/overlay dla grid/lines/dots
- Canvas rendering lub SVG background pattern
- Tło nie jest obiektem Fabric.js - nie można go przesuwać

**UI:**
- Panel "Tło" w sidebarze
- Radio buttons lub dropdown dla typu
- Parametry jako slidery/color pickers
- Live preview

---

### 4.7 Skróty Klawiaturowe

#### 4.7.1 Narzędzia Rysowania
- `1-9` - Przełączanie między ulubionymi pisakami/kolorami
  - Użytkownik może skonfigurować swoje ulubione
  - Domyślnie: 1=czarny długopis, 2=niebieski, 3=czerwony, 4=zielony, 5=highlighter żółty
- `P` - Pencil (ołówek)
- `B` - Brush (pędzel)
- `M` - Marker
- `H` - Highlighter
- `E` - Eraser (gumka)
- `S` - Selection tool (zaznaczanie)
- `L` - Line (linia prosta)
- `R` - Rectangle (prostokąt)
- `C` - Circle (koło)

#### 4.7.2 Nawigacja i Edycja
- `Space + Drag` - Panning (przesuwanie widoku tablicy)
- `Ctrl/Cmd + Scroll` - Zoom in/out
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` lub `Ctrl/Cmd + Shift + Z` - Redo
- `Delete` lub `Backspace` - Usuń zaznaczony obiekt
- `Ctrl/Cmd + A` - Zaznacz wszystko
- `Ctrl/Cmd + C` - Copy
- `Ctrl/Cmd + V` - Paste (duplikuj obiekt lub wklej z clipboard)
- `Ctrl/Cmd + X` - Cut
- `Escape` - Anuluj aktywne narzędzie / odznacz

#### 4.7.3 Widok
- `Ctrl/Cmd + 0` - Reset zoom (100%)
- `Ctrl/Cmd + Plus` - Zoom in
- `Ctrl/Cmd + Minus` - Zoom out
- `F` - Fit to screen (dopasuj tablicę do okna)

#### 4.7.4 Modyfikatory przy Rysowaniu
- `Shift + Drag` - 
  - Linia: blokada do kątów 45°
  - Prostokąt: kwadrat
  - Koło: doskonałe koło (nie elipsa)
- `Alt + Drag` - Rysuj od środka (dla kształtów)

**Implementacja:**
- Global event listeners w React (useEffect)
- Sprawdzanie `e.ctrlKey`, `e.shiftKey`, `e.altKey`
- Conditional logic based on active tool
- Prevent default dla konfliktujących skrótów przeglądarki

---

### 4.8 Real-time Collaboration

#### 4.8.1 Architektura WebSocket

**Connection Flow:**
```
1. Użytkownik otwiera tablicę (nauczyciel lub uczeń)
2. Frontend łączy się z Socket.io serverem
3. Join room: socket.join(boardId)
4. Broadcast do innych użytkowników: "user joined"
```

**Events do Implementacji:**

**Client → Server:**
- `join-board` - dołączenie do pokoju tablicy
- `draw-start` - rozpoczęcie rysowania
- `draw-move` - rysowanie (throttled, ~16ms)
- `draw-end` - zakończenie rysowania
- `add-object` - dodanie kształtu/obrazu/tekstu
- `modify-object` - zmiana pozycji/skali/rotacji obiektu
- `delete-object` - usunięcie obiektu
- `clear-board` - wyczyszczenie całej tablicy
- `cursor-move` - pozycja kursora (throttled, do wyświetlania kursorów innych)

**Server → Client:**
- `user-joined` - nowy użytkownik dołączył
- `user-left` - użytkownik opuścił
- `board-update` - aktualizacja stanu tablicy
- `object-added` - nowy obiekt
- `object-modified` - zmiana obiektu
- `object-deleted` - usunięcie obiektu
- `remote-cursor` - pozycja kursora innego użytkownika

#### 4.8.2 Synchronizacja Danych

**Strategia:**
- **Operational Transformation** (uproszczona) lub **Event Sourcing**
- Każda akcja = event z metadanymi
- Server broadcast do wszystkich w room oprócz nadawcy
- Client otrzymuje event → aktualizuje lokalny canvas

**Struktura Event:**
```json
{
  "type": "object-added",
  "userId": "user-123",
  "timestamp": 1234567890,
  "data": {
    "objectId": "obj-456",
    "fabricObject": {...}
  }
}
```

**Throttling:**
- Rysowanie: wysyłaj pozycje co ~16ms (60fps), nie każdy piksel
- Kursor: wysyłaj pozycję co ~50ms
- Modyfikacja obiektów: wysyłaj tylko po zakończeniu (mouseup)

**Conflict Resolution:**
- "Last write wins" - wystarczy dla 1-5 użytkowników
- Server timestamp jako arbiter
- Nie implementuj CRDT (za skomplikowane na początek)

#### 4.8.3 Wyświetlanie Aktywnych Użytkowników

**UI:**
- Lista awatarów w prawym górnym rogu
- Hover → tooltip z nazwą/ID
- Kolorowe kursory innych użytkowników na canvas
- Każdy użytkownik = unikalny kolor

**Dane użytkownika:**
- `userId` - losowy UUID dla uczniów
- `name` - "Nauczyciel" lub "Uczeń 1", "Uczeń 2" (auto-assigned)
- `color` - hex color dla kursora

**Kursory:**
- Custom cursor element (div) z imieniem
- Pozycja absolute, transform based on canvas coordinates
- Smooth transition animation

---

### 4.9 Zarządzanie Stanem Tablicy

#### 4.9.1 Undo/Redo System

**Implementacja:**
- Stack historii: array JSON states lub array of operations
- Przechowywanie w pamięci (nie w DB - zbyt duże)
- Max historia: 50 kroków

**Podejście 1 - Snapshots:**
```javascript
const history = {
  past: [],  // array serialized canvas states
  present: currentCanvasState,
  future: []
}

// Undo: pop from past, push present to future
// Redo: pop from future, push present to past
```

**Podejście 2 - Operations:**
```javascript
const operations = [
  { type: 'add', objectId: 'x', data: {...} },
  { type: 'modify', objectId: 'y', from: {...}, to: {...} },
  { type: 'delete', objectId: 'z', data: {...} }
]

// Undo: reverse operation
// Redo: replay operation
```

**Rekomendacja:** Snapshots (prostsze, wystarczające dla tego projektu)

**Implementacja w Fabric.js:**
```javascript
canvas.on('object:added', saveState);
canvas.on('object:modified', saveState);
canvas.on('object:removed', saveState);

function saveState() {
  const json = canvas.toJSON();
  historyPast.push(json);
  historyFuture = [];  // clear future on new action
}
```

#### 4.9.2 Auto-save

**Strategia:**
- Debounce: zapisz po 2s braku aktywności
- Lub: zapisz co 30s automatycznie
- Lub: zapisz przy każdej znaczącej zmianie (defer z throttle)

**Implementacja:**
```javascript
// Debounced save
const debouncedSave = debounce(() => {
  const json = canvas.toJSON();
  saveToServer(boardId, json);
}, 2000);

canvas.on('object:modified', debouncedSave);
```

**API:**
- `PATCH /api/boards/:id`
- Body: `{ canvas_data: {...}, updated_at: timestamp }`

---

### 4.10 Export do PDF

#### 4.10.1 Specyfikacja

**Funkcjonalność:**
- Przycisk "Export to PDF" w header
- Modal z opcjami:
  - Format: A4, Letter, Custom
  - Orientacja: Landscape, Portrait
  - Jakość: Standard, High
  - Zakres: Cała tablica, Widoczny obszar

**Implementacja:**

**Podejście 1 - Client-side (jsPDF):**
```javascript
import jsPDF from 'jspdf';

function exportToPDF() {
  const canvas = fabricCanvas.toDataURL('image/png');
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  pdf.addImage(canvas, 'PNG', 0, 0, 297, 210);
  pdf.save('tablica.pdf');
}
```

**Podejście 2 - Server-side (puppeteer):**
- Render canvas na serwerze
- Użyj Puppeteer do generowania PDF
- Zwróć PDF jako download

**Rekomendacja:** Client-side (szybsze, mniej zasobów serwera)

**Challenges:**
- Fabric.js canvas może być większy niż PDF page
- Rozwiązanie: Scale down lub multi-page PDF
- High resolution: render canvas w wyższej rozdzielczości przed export

---

### 4.11 Chunking i Wydajność

#### 4.11.1 Problem

Duża tablica z setkami obiektów:
- Spowolnienie renderowania
- Wysokie użycie pamięci
- Opóźnienia przy synchronizacji

#### 4.11.2 Rozwiązanie: Virtual Canvas + Chunking

**Koncepcja:**
- Podziel tablicę na kafelki (chunks) 1000x1000px
- Ładuj tylko kafelki widoczne + sąsiednie (buffer zone)
- Lazy load pozostałych przy scrollowaniu/panning

**Implementacja:**

**Struktura danych:**
```javascript
const chunks = {
  '0-0': { objects: [...], loaded: true },
  '0-1': { objects: [...], loaded: true },
  '1-0': { objects: [...], loaded: false }
}
```

**Viewport tracking:**
```javascript
function getVisibleChunks(viewportBounds) {
  const startX = Math.floor(viewportBounds.left / CHUNK_SIZE);
  const endX = Math.ceil(viewportBounds.right / CHUNK_SIZE);
  const startY = Math.floor(viewportBounds.top / CHUNK_SIZE);
  const endY = Math.ceil(viewportBounds.bottom / CHUNK_SIZE);
  
  // Return chunks in range + buffer
}
```

**Loading chunks:**
- On scroll/zoom: calculate visible chunks
- Load missing chunks from server/local storage
- Unload chunks far from viewport (memory cleanup)
- Add objects to Fabric.js canvas

**Wyzwania:**
- Synchronizacja: który chunk zawiera obiekt?
- Search: znajdowanie obiektów across chunks
- Crossover: obiekty na granicy chunków

**Uproszczenie dla MVP:**
- Chunking tylko dla load/save, nie dla rendering
- Fabric.js renderuje wszystko na jednym canvas
- Implementacja full chunking w późniejszej fazie

#### 4.11.3 Optymalizacje Fabric.js

**Performance tips:**
- `canvas.renderOnAddRemove = false` - manual render control
- `canvas.requestRenderAll()` - render tylko po zmianach
- `object.selectable = false` dla static objects (tło, obrazy tła)
- `object.evented = false` - wyłącz eventy dla static objects
- Use `canvas.discardActiveObject()` po zakończeniu operacji
- Throttle panning/zooming events

**Limiting objects:**
- Max 500-1000 obiektów na canvas
- Toast notification jeśli limit reached
- Encourage użytkowników do czyszczenia starych treści

---

## 5. Przepływ Użytkownika (User Flows)

### 5.1 Flow Nauczyciela

**1. Rejestracja/Logowanie**
```
Landing page → Rejestracja (email/hasło) → Weryfikacja email (opcjonalnie) → Dashboard
```

**2. Tworzenie Nowej Tablicy**
```
Dashboard → "+ Nowa tablica" → Modal (nazwa tablicy) → Zapisz 
→ Przekierowanie do edytora tablicy (pusta tablica)
```

**3. Praca z Tablicą**
```
Edytor → Wybierz narzędzie (pisak/kształt) → Rysuj/dodaj obiekty 
→ Auto-save → Skopiuj link do udostępnienia
```

**4. Udostępnienie Uczniowi**
```
Edytor → "Udostępnij" button → Skopiuj link → Wyślij uczniowi (email, chat, etc.)
```

**5. Współpraca w Real-time**
```
Nauczyciel i uczeń na tablicy → Widoczne kursory i zmiany 
→ Obaj mogą rysować/edytować → Auto-sync
```

**6. Export Tablicy**
```
Edytor → "Export to PDF" → Wybór opcji → Download PDF
```

### 5.2 Flow Ucznia

**1. Dostęp do Tablicy**
```
Otrzymanie linku → Klik → Automatyczne załadowanie tablicy (bez logowania)
```

**2. Identyfikacja**
```
Opcjonalnie: Modal "Podaj swoje imię" → Zapisz → Widoczne jako "Imię" dla innych
Lub: Automatyczne ID: "Uczeń 1", "Uczeń 2"
```

**3. Praca na Tablicy**
```
Widok tablicy → Pełny dostęp do narzędzi → Rysowanie/dodawanie obiektów 
→ Real-time sync z nauczycielem
```

**4. Wyjście**
```
Zamknięcie karty/okna → Disconnect → Notyfikacja dla nauczyciela "Uczeń opuścił"
```

---

## 6. API Endpoints

### 6.1 Authentication

#### `POST /api/auth/register`
**Body:**
```json
{
  "email": "teacher@example.com",
  "password": "password123",
  "name": "Jan Kowalski"
}
```
**Response:**
```json
{
  "token": "jwt-token",
  "user": { "id": "uuid", "email": "...", "name": "..." }
}
```

#### `POST /api/auth/login`
**Body:**
```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "jwt-token",
  "user": { "id": "uuid", "email": "...", "name": "..." }
}
```

#### `POST /api/auth/refresh`
**Headers:** `Authorization: Bearer {refresh-token}`
**Response:**
```json
{
  "token": "new-jwt-token"
}
```

### 6.2 Boards Management

#### `GET /api/boards`
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "boards": [
    {
      "id": "uuid",
      "title": "Lekcja 1 - Trygonometria",
      "thumbnail_url": "https://...",
      "updated_at": "2024-01-15T10:30:00Z",
      "share_token": "abc123xyz"
    }
  ]
}
```

#### `POST /api/boards`
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "title": "Nowa tablica"
}
```
**Response:**
```json
{
  "id": "uuid",
  "title": "Nowa tablica",
  "share_token": "def456uvw",
  "created_at": "2024-01-15T11:00:00Z"
}
```

#### `GET /api/boards/:id`
**Headers:** `Authorization: Bearer {token}` (dla nauczyciela)
**lub Query:** `?token={share_token}` (dla ucznia)
**Response:**
```json
{
  "id": "uuid",
  "title": "Lekcja 1",
  "background_type": "grid",
  "background_color": "#FFFFFF",
  "canvas_data": { "objects": [...] },
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### `PATCH /api/boards/:id`
**Headers:** `Authorization: Bearer {token}`
**Body:**
```json
{
  "title": "Zaktualizowana nazwa",
  "canvas_data": { "objects": [...] },
  "thumbnail_url": "data:image/png;base64,..."
}
```
**Response:**
```json
{
  "id": "uuid",
  "updated_at": "2024-01-15T11:05:00Z"
}
```

#### `DELETE /api/boards/:id`
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "message": "Board deleted successfully"
}
```

### 6.3 File Upload

#### `POST /api/boards/:id/upload-image`
**Headers:** `Authorization: Bearer {token}` + `Content-Type: multipart/form-data`
**Body:** FormData with `image` file
**Response:**
```json
{
  "url": "https://storage.../image.png",
  "width": 1920,
  "height": 1080
}
```

#### `POST /api/boards/:id/upload-pdf`
**Headers:** `Authorization: Bearer {token}` + `Content-Type: multipart/form-data`
**Body:** FormData with `pdf` file
**Response:**
```json
{
  "pages": [
    { "pageNumber": 1, "url": "https://storage.../page-1.png" },
    { "pageNumber": 2, "url": "https://storage.../page-2.png" }
  ]
}
```

### 6.4 Board Access (dla uczniów bez auth)

#### `GET /api/board/{share_token}`
**No authentication required**
**Response:**
```json
{
  "id": "uuid",
  "title": "Lekcja 1",
  "canvas_data": { "objects": [...] },
  "background_type": "grid"
}
```

---

## 7. WebSocket Events Specification

### 7.1 Connection

**Client connects:**
```javascript
const socket = io('wss://api.example.com', {
  query: { boardId: 'board-uuid', userId: 'user-uuid' }
});
```

**Server acknowledges:**
```javascript
socket.emit('connected', { 
  userId: 'user-uuid',
  activeUsers: ['user-1', 'user-2']
});
```

### 7.2 Drawing Events

#### `draw-start`
**Payload:**
```json
{
  "userId": "user-123",
  "tool": "pencil",
  "color": "#000000",
  "width": 2,
  "x": 100,
  "y": 200
}
```

#### `draw-move`
**Payload (throttled to ~60fps):**
```json
{
  "userId": "user-123",
  "points": [
    { "x": 101, "y": 201 },
    { "x": 102, "y": 202 }
  ]
}
```

#### `draw-end`
**Payload:**
```json
{
  "userId": "user-123",
  "pathId": "path-456",
  "fabricObject": { /* serialized Fabric.js Path */ }
}
```

### 7.3 Object Manipulation

#### `add-object`
**Payload:**
```json
{
  "userId": "user-123",
  "objectId": "obj-789",
  "type": "rect",
  "fabricObject": { /* serialized Fabric.js Object */ }
}
```

#### `modify-object`
**Payload:**
```json
{
  "userId": "user-123",
  "objectId": "obj-789",
  "changes": {
    "left": 150,
    "top": 250,
    "scaleX": 1.5
  }
}
```

#### `delete-object`
**Payload:**
```json
{
  "userId": "user-123",
  "objectId": "obj-789"
}
```

### 7.4 User Presence

#### `cursor-move`
**Payload (throttled to ~20fps):**
```json
{
  "userId": "user-123",
  "x": 500,
  "y": 300
}
```

#### `user-joined`
**Broadcast to all:**
```json
{
  "userId": "user-456",
  "name": "Uczeń 2",
  "color": "#FF5733"
}
```

#### `user-left`
**Broadcast to all:**
```json
{
  "userId": "user-456"
}
```

---

## 8. UI/UX Guidelines

### 8.1 Design Principles
- **Minimalizm:** Czyste, nieintruzywne UI - focus na canvas
- **Responsywność:** Płynne animacje, brak lagów
- **Accessibility:** Klawiszowe skróty, tooltips, focus states
- **Feedback:** Wizualne potwierdzenia akcji (toast notifications)

### 8.2 Color Palette (sugestia)

**Primary:**
- `#2563EB` - Blue (przyciski, active states)
- `#3B82F6` - Light Blue (hover states)

**Neutrals:**
- `#FFFFFF` - White (canvas background)
- `#F9FAFB` - Light Gray (sidebar background)
- `#6B7280` - Medium Gray (icons, text)
- `#1F2937` - Dark Gray (headings)

**Feedback:**
- `#10B981` - Green (success)
- `#EF4444` - Red (error, delete)
- `#F59E0B` - Orange (warning)

### 8.3 Typography
- **Font Family:** Inter, SF Pro, Segoe UI, system fonts
- **Sizes:**
  - Headers: 24px (bold)
  - Body: 14px (regular)
  - Small: 12px (tooltips, labels)

### 8.4 Spacing
- **Toolbar:** 60px wide (left), 300px wide (right sidebar)
- **Padding:** 16px standard, 8px tight
- **Icon size:** 24x24px

### 8.5 Responsiveness
- **Minimum screen:** 1024px width (iPad landscape)
- **Optimal:** 1920x1080 (desktop)
- **Mobile:** Not supported initially (show warning message)

---

## 9. Security Considerations

### 9.1 Authentication
- **Password hashing:** bcrypt (cost factor 10+)
- **JWT expiration:** 1 hour (access token), 7 days (refresh token)
- **HTTPS only:** All API calls over SSL

### 9.2 Authorization
- **Board access:**
  - Nauczyciel: tylko własne tablice
  - Uczeń: tylko z poprawnym `share_token`
- **Validation:** Backend weryfikuje uprawnienia przy każdym zapytaniu

### 9.3 Input Validation
- **File uploads:**
  - Type checking (MIME type + extension)
  - Size limits (10MB images, 20MB PDF)
  - Sanitization nazw plików
- **Canvas data:**
  - JSON schema validation
  - Max size limits (prevent DOS)

### 9.4 Rate Limiting
- **API endpoints:** 100 requests/minute per IP
- **WebSocket:** Throttle events (draw, cursor)
- **File uploads:** 10 uploads/hour per user

### 9.5 Data Privacy
- **Share tokens:** Cryptographically secure random (UUID v4)
- **User data:** Nie przechowuj IP ani tracking data uczniów
- **GDPR:** Opcja usunięcia konta nauczyciela + wszystkich tablic

---

## 10. Testing Strategy

### 10.1 Unit Tests
- **Frontend:** Jest + React Testing Library
  - Komponenty UI
  - Custom hooks
  - Utility functions
- **Backend:** Jest + Supertest
  - API endpoints
  - Authentication logic
  - Database operations

### 10.2 Integration Tests
- **WebSocket:** Test real-time synchronizacji
- **File upload:** Test całego flow upload → storage → retrieval
- **Canvas operations:** Test serialization/deserialization Fabric.js

### 10.3 E2E Tests
- **Playwright lub Cypress**
- Scenariusze:
  - Nauczyciel tworzy tablicę → uczeń dołącza → współpraca
  - Upload PDF → dodanie stron na canvas
  - Export do PDF

### 10.4 Performance Tests
- **Load testing:** 10 concurrent users na jednej tablicy
- **Canvas stress test:** 500+ obiektów na canvas
- **WebSocket latency:** Measure delay synchronizacji

---

## 11. Deployment & Infrastructure

### 11.1 Environment Variables

**Frontend (.env):**
```
REACT_APP_API_URL=https://api.example.com
REACT_APP_WS_URL=wss://api.example.com
```

**Backend (.env):**
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
PORT=3001
```

### 11.2 Database Migrations
- **Tool:** node-pg-migrate lub Prisma Migrate
- **Versioning:** Sequential migrations (001_initial, 002_add_background, etc.)

### 11.3 File Storage
- **Option 1:** AWS S3 + CloudFront CDN
- **Option 2:** MinIO (self-hosted S3-compatible)
- **Option 3:** Local filesystem (tylko dev/testing)

### 11.4 Monitoring
- **Error tracking:** Sentry
- **Logs:** Winston + Logtail/Papertrail
- **Uptime:** UptimeRobot
- **Analytics:** Plausible (privacy-friendly) lub Google Analytics

---

## 12. Future Enhancements (Post-MVP)

### 12.1 Faza 2
- [ ] Tekst na canvas (Text tool z edycją inline)
- [ ] LaTeX support (matematyczne formuły)
- [ ] Zaawansowane gumki (erase strokes, not objects)
- [ ] Layer system (z-index management)
- [ ] Lock objects (prevent accidental moves)
- [ ] Grid snapping (przyciąganie do siatki)

### 12.2 Faza 3
- [ ] Templates (pre-made tablice: algebra, geometria, etc.)
- [ ] Voice chat integration (WebRTC)
- [ ] Screen sharing (nauczyciel → uczniowie)
- [ ] Recording sessions (save as video)
- [ ] Whiteboard history viewer (playback session)

### 12.3 Faza 4
- [ ] Mobile apps (React Native)
- [ ] Offline mode (PWA + IndexedDB)
- [ ] AI assistant (suggest shapes, auto-beautify drawings)
- [ ] Advanced 3D shapes (Three.js integration)
- [ ] Collaborative cursors with names/avatars

---

## 13. Inspiracja z Idroo

### 13.1 Kluczowe Features z Idroo do Adoptowania

**1. Infinite Canvas**
- Tablica bez granic, smooth panning
- Minimap (opcjonalnie) dla nawigacji

**2. Smooth Drawing**
- Algorytm wygładzania linii (Catmull-Rom spline lub similar)
- Pressure sensitivity (jeśli tablet/stylus)

**3. Quick Shape Recognition**
- Rysowanie ręczne → auto-convert do perfect shape
- Np. nierówny okrąg → perfect circle
- Opcjonalne: włącz/wyłącz

**4. Color Palette**
- Quick access do popularnych kolorów
- Custom colors + color history

**5. Toolbar Positioning**
- Floating toolbar (może być przesuwalna)
- Minimize/expand

**6. Gesture Support (opcjonalnie)**
- Two-finger pan (na touch devices)
- Pinch to zoom

### 13.2 Różnice/Ulepszenia vs Idroo

**Twoje Unikalne Features:**
- Matematyczne kształty (wielokąty, układy współrzędnych)
- PDF upload z wyborem stron
- Skróty klawiszowe (1-9 for tools)
- Export to PDF (Idroo ma tylko obrazy?)
- Może: LaTeX support w przyszłości

---

## 14. Przykładowa Struktura Projektu

```
whiteboard-app/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/
│   │   │   │   ├── Canvas.jsx
│   │   │   │   ├── Toolbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── DrawingTools/
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── BoardCard.jsx
│   │   │   │   └── BoardList.jsx
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   └── UI/
│   │   │       ├── Button.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── Toast.jsx
│   │   ├── hooks/
│   │   │   ├── useCanvas.js
│   │   │   ├── useWebSocket.js
│   │   │   └── useAuth.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── websocket.js
│   │   │   └── storage.js
│   │   ├── utils/
│   │   │   ├── fabricHelpers.js
│   │   │   ├── geometryShapes.js
│   │   │   └── pdfExport.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CanvasContext.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── boards.js
│   │   │   └── upload.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── boardController.js
│   │   │   └── uploadController.js
│   │   ├── models/
│   │   │   ├── Teacher.js
│   │   │   └── Board.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── services/
│   │   │   ├── pdfService.js
│   │   │   └── storageService.js
│   │   ├── websocket/
│   │   │   ├── socketServer.js
│   │   │   └── handlers.js
│   │   ├── db/
│   │   │   ├── connection.js
│   │   │   └── migrations/
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── API.md
│   ├── WEBSOCKET.md
│   └── DEPLOYMENT.md
│
└── README.md
```

---

## 15. Kluczowe Decyzje Techniczne - Podsumowanie

| Aspekt | Wybór | Alternatywa | Uzasadnienie |
|--------|-------|-------------|--------------|
| **Canvas Library** | Fabric.js | Konva.js, Paper.js | Najlepsza balance: features + performance |
| **Real-time** | Socket.io | WebRTC, Pusher | Standard, łatwa implementacja |
| **Database** | PostgreSQL | MongoDB, MySQL | JSONB dla canvas_data, relacje dla users/boards |
| **File Storage** | AWS S3 | MinIO, Local | Skalowalność, CDN integration |
| **PDF Rendering** | pdf.js | PDFKit, Puppeteer | Client-side, lightweight |
| **Auth** | JWT | Sessions, OAuth | Stateless, scalable |
| **Styling** | Tailwind CSS | Styled-components, Emotion | Rapid prototyping, utility-first |

---

## 16. Pytania do Rozważenia Przed Implementacją

1. **Hosting budget?** Czy selfhost czy cloud (AWS, Render, Railway)?
2. **Domain?** Jaka nazwa domeny? Potrzebujesz SSL cert.
3. **Email service?** Do weryfikacji rejestracji (SendGrid, Mailgun)?
4. **Backup strategy?** Jak często backup bazy i plików?
5. **User limits?** Max tablice per nauczyciel? Max size per tablica?
6. **Analytics?** Czy śledzić usage (liczba sesji, popularne features)?
7. **Support?** Jak użytkownicy zgłaszają bugi? (email, chat, forum?)

---

## 17. Getting Started - First Steps

### 17.1 Setup Development Environment

1. **Install dependencies:**
   - Node.js 18+
   - PostgreSQL 14+
   - Git

2. **Clone & Install:**
   ```bash
   git clone <repo>
   cd whiteboard-app
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Setup Database:**
   ```bash
   createdb whiteboard_dev
   npm run migrate
   ```

4. **Environment variables:**
   - Copy `.env.example` → `.env`
   - Fill in credentials

5. **Run dev servers:**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend (new terminal)
   cd frontend && npm start
   ```

### 17.2 First Implementation Tasks (w kolejności)

#### Week 1: Core Infrastructure
- [ ] Setup project structure (frontend + backend)
- [ ] Database schema + migrations
- [ ] Authentication (register, login, JWT)
- [ ] Basic API endpoints (CRUD boards)
- [ ] React routing + dashboard layout

#### Week 2: Canvas MVP
- [ ] Fabric.js integration
- [ ] Basic drawing tools (pencil, eraser)
- [ ] Color picker + thickness slider
- [ ] Save/load canvas state to DB
- [ ] Undo/Redo

#### Week 3: Real-time Collaboration
- [ ] Socket.io setup
- [ ] WebSocket events (draw, modify, delete)
- [ ] Synchronization logic
- [ ] User presence (cursors, list)
- [ ] Share link generation

#### Week 4: Advanced Features
- [ ] Shapes (rectangle, circle, line)
- [ ] Geometric shapes (polygons)
- [ ] Image upload + paste from clipboard
- [ ] PDF upload + page selection
- [ ] Background options (grid, lines)

#### Week 5: Polish & Export
- [ ] Keyboard shortcuts
- [ ] Export to PDF
- [ ] Thumbnails for board list
- [ ] Toast notifications
- [ ] Error handling + loading states

#### Week 6: Testing & Deployment
- [ ] Unit tests (key functions)
- [ ] E2E tests (critical flows)
- [ ] Performance optimization
- [ ] Deploy to production
- [ ] Documentation

---

## 18. Zakończenie

To jest kompletna specyfikacja dla wirtualnej tablicy matematycznej. Dokument zawiera wszystkie kluczowe aspekty:

✅ **Architektura** - stack, struktura danych  
✅ **Funkcjonalności** - rysowanie, kształty, współpraca  
✅ **API** - wszystkie endpointy  
✅ **WebSocket** - real-time events  
✅ **UI/UX** - guidelines, skróty klawiszowe  
✅ **Bezpieczeństwo** - auth, validation  
✅ **Deployment** - infrastruktura  
✅ **Roadmap** - MVP + future enhancements  

**Następne kroki:**
1. Przejrzyj specyfikację, zaznacz co jest must-have vs nice-to-have
2. Prześlij tę specyfikację do Claude Code
3. Rozpocznij implementację od Week 1 tasków
4. Iteruj - nie musisz zrobić wszystkiego od razu!

Powodzenia z projektem! 🚀
