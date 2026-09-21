## 1.6.2 — 2026-09-21

### 📱 iPhone ikon – végleges Project Hub logó
- Az iPhone főképernyős ikon most a kifejezetten a Project Hub neon logóból készített 180×180 PNG-t használja.
- A korábban használt 192×192 ikon első verziója kikerült az iPhone elsődleges ikonútvonalából.
- A manifest és az apple-touch-icon ugyanazt a végleges Project Hub logóképet használja.
- Service worker cache frissítve v15-re.

## 1.6.1 — 2026-09-21

### 📱 iPhone / PWA ikon javítás
- Az iPhone főképernyős ikon most közvetlenül a meglévő Project Hub 192×192 PNG ikonból töltődik.
- Az előző assets/apple-touch-icon.png hivatkozás kikerült az elsődleges PWA ikonútvonalból, mert iOS-en továbbra is alapértelmezett „P” ikon jelent meg.
- Az index.html most explicit apple-touch-icon, favicon, manifest és theme-color meta beállítást tartalmaz.
- A PWA manifest visszakapta a 192×192 és 512×512 ikonokat maskable támogatással.
- Service worker cache verzió frissítve v14-re, hogy a régi ikon cache-e ne maradjon aktív.

# Changelog

## 1.5.2 — 2026-09-20

- Stabilizálva az egyéb játékok szerkesztése és mentés utáni frissítése.
- A játéklista maradék emoji műveleti és játékidő ikonokat Flaticon UIcons ikonok váltják.
- A Steam achievement ikonok átadása javítva.
- PWA cache és fejlesztői console verzió frissítve 1.5.2-re.


## 1.5.1 — 2026-09-20

- Javítva az „Egyéb játékaid” hozzáadás/szerkesztés űrlap hiányzó állapot- és kedvenc mezője.
- Stabilabb mobilos játéklista és szűrőelrendezés.
- Az állapot- és részletező nézetekben az emoji ikonokat Flaticon UIcons ikonok váltják.
- Javítva a játék részletező fejlécének idő kijelzése.


## 1.5.0 — 2026-09-19

### 🎨 Ikonrendszer frissítés
- Az alkalmazás látható UI-ikonjai egységes Flaticon UIcons Bold Rounded készletre váltottak.
- Az emoji-alapú navigációs, keresési, műveleti, profil-, játék-, hely- és állapotikonok egységes vektoros ikonokra cserélve.
- Az ikonok méretezése és igazítása mobilon és asztali nézetben is egységesítve.
- A dinamikusan renderelt játék-, hely-, feladat- és jegyzetikonok is az új ikonrendszert használják.
- Service worker cache frissítve `v10`-re.
- Az alkalmazás verziója egységesítve `1.5.0`-ra.

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
