## 1.6.4 — 2026-09-22

### ⚡ Hibajavítás és gyorsítás
- Javítva a Játékok oldal JavaScript szintaktikai hibája, amely megakadályozhatta az oldal betöltését.
- A Steam könyvtár lekérése most legfeljebb 20 másodpercig vár, utána egyértelmű hibaüzenetet ad.
- A játékoldal indulásakor a független háttérlekérések párhuzamosan indulnak.
- A Steam játéklista 60 másodperces rövid szerveroldali cache-t kapott, így az ismételt betöltések gyorsabbak.
- A verziószám minden felületen 1.6.4-ra frissítve.

## 1.6.2 — 2026-09-22

### 🔔 Automatikus frissítési értesítés
- Az alkalmazás induláskor ellenőrzi a közzétett aktuális verziót.
- Új verzió esetén frissítési értesítés kerül az alkalmazáson belüli Értesítések Inboxba.
- Ha a böngészős értesítések engedélyezve vannak, külön rendszerértesítés is megjelenik.
- A főoldali verziószám és a PWA verziójelölések 1.6.2-re frissítve.

## 1.6.1 — 2026-09-22

### 🎮 Egyéni játék képkeresés
- A „Képkeresési név” mező most közvetlenül a SteamGridDB kereséséhez kerül elküldésre.
- A találat azonnal megjelenik előnézetként, és a megtalált kép URL-je menthető a játékhoz.
- A képkeresés külön visszajelzést ad sikeres és sikertelen keresés esetén.

## 1.7.1 — 2026-09-22

### Értesítési Inbox
- Új **Értesítések** oldal az alkalmazáson belül.
- A feladat-emlékeztetők most az Inboxba is bekerülnek.
- Olvasatlan értesítések száma megjelenik a főmenüben és a főoldali kártyán.
- Értesítések olvasottként jelölhetők, illetve az összes értesítés törölhető.
- A Service Worker cache frissítve az új oldalhoz.

## 1.7.0 — 2026-09-22

### ⏰ Feladatok: határidő és emlékeztető
- A feladatokhoz határidő és előzetes emlékeztető adható.
- A szerkesztőben 5 perc, 15 perc, 30 perc, 1 óra és 1 napos figyelmeztetés választható.
- A lejárt határidők külön vizuális jelzést kapnak.
- A frontend elküldi a dueDate és reminderMinutes mezőket a Tasks API-nak.

### 🔔 Értesítések
- Új értesítési beállítások kerültek a Profil oldalra.
- A felhasználó külön engedélyezheti és kikapcsolhatja a Project Hub értesítéseit.
- A feladat-emlékeztetők külön kapcsolhatóak.
- Service worker push-kezelés előkészítve a háttérben érkező telefonos értesítésekhez.

## 1.6.4 — 2026-09-21

### 🎮 SteamGridDB automatikus kép-fallback
- Ha egy Steam játék egyik normál Steam artwork URL-je sem töltődik be, a frontend csak ekkor indít SteamGridDB fallback lekérést.
- A backend a Steam AppID alapján a hivatalos SteamGridDB v2 API-t használja, és 460×215 / 920×430 vízszintes artworköt kér.
- A fallback csak hitelesített felhasználónál és a saját Steam könyvtárában lévő AppID-ra fut le.
- A frontend AppID-nként cache-eli a fallback lekérést, így a kártya és a részletes nézet nem indítja el újra ugyanazt a kérést.
- A SteamGridDB API-kulcs a backend STEAMGRIDDB_API_KEY környezeti változója; kulcs nélkül a normál Steam képek továbbra is működnek.

### 📱 Letisztult Project Hub PWA ikon
- A korábbi színes neon ikon helyett egységes, sötét háttérre épülő, minimalista hub-jel került a PWA/iPhone ikonokba.
- Frissítve a 180×180, 192×192 és 512×512 PNG ikon.
- A favicon is ugyanazt a letisztult vizuális irányt követi.
- Service worker cache frissítve v16-ra, hogy az új ikon és frontend kód biztosan újratöltődjön.

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
