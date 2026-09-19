# Changelog

## 1.5.1
- Egyéb játékok hozzáadás/szerkesztés/törlés stabilizálva helyi és felhős mentéssel.
- Javítva a lokális egyéb játékok szerkesztése, amikor a felhős mentés átmenetileg nem elérhető.
- Az Áttekintés élőben mutatja a feladatok, jegyzetek, játékok és helyek számát, valamint a feladatok készültségi százalékát.
- Az Áttekintés statisztikái 30 másodpercenként automatikusan frissülnek.
- Emoji-alapú UI ikonok eltávolítva a főbb nézetekből, egységes Flaticon Uicons használattal.
- PWA cache verzió frissítve, hogy az új JS/CSS biztosan betöltődjön.


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
