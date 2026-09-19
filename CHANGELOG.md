# Project Hub — Changelog

## 1.5.0 — 2026-09-19
- 🏠 A főmenü Áttekintés része teljesen új dashboard megjelenést kapott.
- 📊 Élő feladat-, jegyzet-, játék- és helyszámok jelennek meg.
- ✅ A feladatok készültségi aránya vizuális haladási sávval látható.
- 📱 Az Áttekintés mobilon és asztali nézetben is reszponzív.
- 🔗 A statisztikai kártyák közvetlenül a kapcsolódó modulokra vezetnek.
- 🔢 Az alkalmazás verziója 1.5.0.0-ra frissítve.

# Changelog

## 1.4.2 — 2026-09-19

- 🎮 Újratervezett játékkereső és rendező szűrők a Games oldalon.
- ✏️ Javítva az „Egyéb játékaid” szerkesztése: a szerkesztőablak most megfelelően betölti és menti az állapotot és kedvenc jelölést is.
- 📱 A Games szűrők mobilon is rendezett, érintésbarát elrendezést kaptak.
- 🔢 A megjelenített alkalmazásverzió 1.4.2.0-ra frissítve.

## 1.4.1 — Steam játék részletek javítása

- Javítva a Steam játék részletes nézetének API végpontja.
- A frontend most a backend tényleges `/api/steam/game/:appid` végpontját használja.
- A részletes nézet a backend által visszaadott játékadatokból is frissíti a játékidőt és a borítóképet.
- Stabilabb achievement betöltés és hibakezelés.

# Project Hub – CHANGELOG

## 1.4.0 — 2026-09-19

### 🎮 Játékok 2.0
- Az egyéni játékok mostantól szerveroldalon is menthetők.
- Egyéni játék szerkesztése és törlése.
- Kedvenc játék jelölés.
- Játékállapotok: Játszani szeretném / Játszom / Végigjátszva.
- A korábbi helyi egyéni játékadatok első szinkronizáláskor megpróbálnak felkerülni a felhőbe.
- Offline fallback továbbra is működik a helyi könyvtárral.

### 📍 Helyek 2.0
- Teljes helykezelő modul.
- Hely létrehozása, szerkesztése, törlése.
- Kedvencek.
- Kategóriák és szűrés.
- Keresés név, cím és megjegyzés alapján.
- Szerveroldali mentés PostgreSQL-ben.
- Offline helyi fallback.
- Mobilbarát modal és kártyás megjelenítés.

### ☁️ Cloud / backend
- Új `custom_games` adatbázistábla.
- Új `places` adatbázistábla.
- Új API végpontok saját játékokhoz és helyekhez.
- Felhasználónként elkülönített adatok.
- Tulajdonosi ellenőrzés minden módosító API műveletnél.

### 📱 PWA / stabilitás
- Verziószám egységesítve `1.4.0`.
- Service worker cache frissítve `v7`-re.
- Mobilos megjelenítés és szövegtúlcsordulás további javítása.
- A fejlesztői console és az app-frissítés rendszer is 1.4-es verziót jelez.
