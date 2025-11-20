# Tablica Matematyczna - Wirtualna Tablica do Nauczania Online

Aplikacja webowa do prowadzenia lekcji matematyki online z funkcją współdzielenia tablicy w czasie rzeczywistym między nauczycielem a uczniami.

## Funkcjonalności (MVP - Week 1)

✅ **Zaimplementowane:**
- Autentykacja nauczycieli (rejestracja, logowanie, JWT)
- CRUD tablic (tworzenie, odczyt, aktualizacja, usuwanie)
- Dashboard nauczyciela z listą tablic
- Generowanie unikalnych linków dla uczniów
- Struktura WebSocket dla real-time collaboration
- Podstawowy interfejs edytora tablicy (placeholder)

🚧 **W następnych krokach:**
- Integracja Fabric.js dla rysowania
- Narzędzia rysowania (pisaki, gumka, kształty)
- Real-time synchronizacja rysunków
- Upload PDF i obrazów
- Export do PDF

## Stack Technologiczny

### Backend
- Node.js + Express.js
- PostgreSQL (baza danych)
- Socket.io (WebSocket real-time)
- JWT (autentykacja)
- Bcrypt (hashowanie haseł)

### Frontend
- React 18 + Vite
- Fabric.js (canvas/rysowanie) - do zintegrowania
- Socket.io Client (WebSocket)
- Zustand (state management)
- Tailwind CSS (styling)
- React Router (routing)

## Wymagania

- Node.js 18+
- PostgreSQL 14+
- npm lub yarn

## Instalacja i Uruchomienie

### 1. Sklonuj repozytorium

```bash
git clone <repo-url>
cd tablica
```

### 2. Konfiguracja Bazy Danych

Utwórz bazę danych PostgreSQL:

```bash
createdb tablica_dev
```

Lub w PostgreSQL CLI:
```sql
CREATE DATABASE tablica_dev;
```

### 3. Backend Setup

```bash
cd backend

# Instalacja zależności
npm install

# Konfiguracja - skopiuj .env.example i edytuj dane
cp .env.example .env

# Edytuj plik .env i ustaw DATABASE_URL:
# DATABASE_URL=postgresql://user:password@localhost:5432/tablica_dev

# Uruchom migracje bazy danych
npm run migrate

# Uruchom serwer deweloperski
npm run dev
```

Backend będzie działać na `http://localhost:3001`

### 4. Frontend Setup

```bash
cd ../frontend

# Instalacja zależności
npm install

# Uruchom serwer deweloperski
npm run dev
```

Frontend będzie działać na `http://localhost:3000`

## Pierwsze Kroki

1. Otwórz `http://localhost:3000` w przeglądarce
2. Zarejestruj nowe konto nauczyciela
3. Zaloguj się
4. Utwórz nową tablicę
5. Skopiuj link do udostępnienia uczniom
6. Otwórz link w nowej karcie/oknie incognito (tryb ucznia)

## Testowe Konto

Backend ma już wstępnie utworzone testowe konto:
- Email: `test@example.com`
- Hasło: `test123`

**Uwaga:** To konto jest tylko dla celów deweloperskich. Usuń je w produkcji.

## Struktura Projektu

```
tablica/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Logika biznesowa
│   │   ├── models/         # Modele bazy danych
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation
│   │   ├── websocket/      # Socket.io handlers
│   │   ├── db/            # Połączenie i migracje
│   │   └── server.js      # Główny plik serwera
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/      # Login, Register
│   │   │   ├── Dashboard/ # Lista tablic
│   │   │   ├── Canvas/    # Edytor tablicy
│   │   │   └── UI/        # Komponenty UI
│   │   ├── services/      # API, WebSocket
│   │   ├── context/       # Zustand stores
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docs/                  # Dokumentacja
└── README.md
```

## API Endpoints

### Autentykacja
- `POST /api/auth/register` - Rejestracja
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/refresh` - Odświeżenie tokena
- `GET /api/auth/profile` - Profil użytkownika (wymagana autentykacja)

### Tablice
- `GET /api/boards` - Lista tablic nauczyciela (wymagana autentykacja)
- `POST /api/boards` - Utworzenie tablicy (wymagana autentykacja)
- `GET /api/boards/:id` - Szczegóły tablicy (wymagana autentykacja)
- `PATCH /api/boards/:id` - Aktualizacja tablicy (wymagana autentykacja)
- `DELETE /api/boards/:id` - Usunięcie tablicy (wymagana autentykacja)
- `GET /api/boards/shared/:token` - Dostęp do tablicy przez link (bez autentykacji)

### Upload (do implementacji)
- `POST /api/upload/image` - Upload obrazu
- `POST /api/upload/pdf` - Upload PDF

## WebSocket Events

### Client → Server
- `join-board` - Dołączenie do tablicy
- `draw-start` - Rozpoczęcie rysowania
- `draw-move` - Rysowanie
- `draw-end` - Zakończenie rysowania
- `add-object` - Dodanie obiektu
- `modify-object` - Modyfikacja obiektu
- `delete-object` - Usunięcie obiektu
- `cursor-move` - Ruch kursora

### Server → Client
- `board-joined` - Potwierdzenie dołączenia
- `user-joined` - Nowy użytkownik dołączył
- `user-left` - Użytkownik opuścił tablicę
- `remote-draw-start/move/end` - Zdalne rysowanie
- `object-added/modified/deleted` - Zmiany obiektów
- `remote-cursor` - Pozycja kursora innego użytkownika

## Zmienne Środowiskowe

### Backend (.env)
```
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/tablica_dev
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

## Development

### Backend

```bash
cd backend
npm run dev    # Uruchom z nodemon (auto-restart)
npm start      # Uruchom bez auto-restart
```

### Frontend

```bash
cd frontend
npm run dev      # Serwer deweloperski
npm run build    # Build produkcyjny
npm run preview  # Preview buildu
```

## Następne Kroki (Roadmap)

### Week 2: Canvas MVP
- [ ] Integracja Fabric.js
- [ ] Podstawowe narzędzia rysowania (ołówek, długopis, gumka)
- [ ] Wybór koloru i grubości linii
- [ ] Zapis/odczyt stanu canvas z bazy
- [ ] Undo/Redo

### Week 3: Real-time Collaboration
- [ ] Synchronizacja rysowania w czasie rzeczywistym
- [ ] Wyświetlanie kursorów innych użytkowników
- [ ] Lista aktywnych użytkowników
- [ ] Obsługa rozłączeń

### Week 4: Zaawansowane Funkcje
- [ ] Kształty geometryczne (prostokąty, koła, wielokąty)
- [ ] Upload i wklejanie obrazów
- [ ] Upload PDF z wyborem stron
- [ ] Różne tła (siatka, linie, kropki)

### Week 5: Polish & Export
- [ ] Skróty klawiaturowe
- [ ] Export do PDF
- [ ] Generowanie miniaturek tablic
- [ ] Powiadomienia (toast)
- [ ] Obsługa błędów

### Week 6: Testing & Deployment
- [ ] Testy jednostkowe
- [ ] Testy E2E
- [ ] Optymalizacja wydajności
- [ ] Deploy na produkcję

## Szczegółowa Specyfikacja

Pełna specyfikacja projektu znajduje się w pliku `specyfikacja-tablica-matematyczna.md`

## Licencja

MIT

## Autor

Projekt stworzony według specyfikacji w `specyfikacja-tablica-matematyczna.md`
