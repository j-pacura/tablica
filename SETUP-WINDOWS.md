# 🪟 Setup dla Windows

## Szybki start (automatyczny)

```powershell
# 1. Otwórz PowerShell w folderze projektu
cd C:\Users\ROG\Desktop\Projekty\webpages\tablica

# 2. Uruchom skrypt setup (może wymagać uprawnień administratora)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup-windows.ps1
```

## Ręczny setup (jeśli skrypt nie działa)

### 1. Backend

```powershell
cd backend

# Skopiuj plik konfiguracyjny
Copy-Item .env.example .env

# Zainstaluj zależności
npm install

# Utwórz bazę danych
npm run migrate

# Uruchom serwer (zostaw ten terminal otwarty)
npm run dev
```

### 2. Frontend (NOWY terminal PowerShell)

```powershell
cd frontend

# Zainstaluj zależności
npm install

# Uruchom aplikację (zostaw ten terminal otwarty)
npm run dev
```

### 3. Otwórz przeglądarkę

👉 http://localhost:3002

### 4. Zarejestruj się

- Kliknij "Zarejestruj się"
- Wpisz swój email i hasło (min. 8 znaków)
- Zaloguj się i zacznij używać!

## Rozwiązywanie problemów

### Problem: "Cannot find module"
**Rozwiązanie:** Uruchom `npm install` w folderze backend i frontend

### Problem: "Port 3002 already in use"
**Rozwiązanie:** Zamknij inne aplikacje używające tego portu lub zmień port w `frontend/vite.config.js`

### Problem: Nie mogę się zalogować
**Rozwiązanie:** 
1. Sprawdź czy backend działa (terminal 1 powinien pokazywać `🚀 Server running on port 3001`)
2. Sprawdź czy CORS pokazuje port 3002: `🌐 CORS enabled for: http://localhost:3002`
3. Spróbuj zarejestrować nowe konto zamiast logowania

### Problem: "execution policy" error
**Rozwiązanie:** Uruchom PowerShell jako Administrator i wpisz:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Potrzebujesz pomocy?

Zobacz główny README.md lub zgłoś issue na GitHubie!
