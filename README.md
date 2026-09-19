# 🚀 Project Hub — v1.3

A Project Hub egy személyes, mobil-first dashboard és játékközpont, amely a jegyzeteket, feladatokat, profilkezelést, Steam-integrációt és saját játékgyűjteményt egyetlen felületen fogja össze.

## ✨ v1.3 fő újdonságai

- 🎮 teljes Steam-kapcsolati folyamat a Profil oldalon
- 📚 külön Steam és Egyéni játék könyvtár
- 🏆 Steam játék achievementek megjelenítése
- 👤 megújult Profil oldal és Steam státusz
- 📱 mobil-first, reszponzív felület
- 👆 mobilos gesztusok tesztverziója
- 🔄 pull-to-refresh és appon belüli frissítési visszajelzés
- 📲 PWA / iPhone telepíthetőség
- 🖥️ fejlesztői Console és diagnosztikai információk
- 🎨 egységesített belső oldalak és kártyás UI
- 🔢 egységes Project Hub v1.3 verziójelölés

## 🧩 Funkciók

### 🏠 Főoldal

- gyors áttekintés a fontos modulokról
- Jegyzetek, Feladatok, Játékok, Helyek és Profil elérése
- statisztikai kártyák
- mobilbarát navigáció
- alkalmazásverzió megjelenítése

### 📝 Jegyzetek

- ➕ létrehozás
- ✏️ szerkesztés
- 🗑️ törlés
- 📌 rögzítés
- 🔍 keresés
- 🏷️ kategóriák és szűrés
- ↕️ rendezés
- 📖 teljes jegyzet nézet
- 💾 automatikus mentés

### ✅ Feladatok

- ➕ létrehozás
- ✏️ szerkesztés
- 🗑️ törlés
- ☑️ kész / nincs kész állapot
- ⭐ fontos feladatok
- 📌 rögzítés
- 🔍 keresés
- 🏷️ státusz- és kategóriaszűrés
- ↕️ rendezés
- 📊 statisztikák
- 📈 haladási sáv
- 💾 automatikus mentés

### 🎮 Játékok

#### Steam könyvtár

- 🔗 Steam-fiók összekapcsolása
- 👤 Steam profil megjelenítése
- 🖼️ Steam profilkép
- 🆔 SteamID
- 🎮 Steam játéklista
- ⏱️ játékidő
- 🔍 játékkeresés
- 📊 játékadatok
- 🏆 achievementek
- 🔗 Steam profil megnyitása

#### 📚 Egyéni könyvtár

- saját játék hozzáadása
- játék neve
- játék képe
- saját játékidő
- külön Egyéni könyvtár
- váltás a Steam és Egyéni könyvtár között

### 👤 Profil

- felhasználónév
- email
- profilkép
- profilkép módosítása
- kijelentkezés
- Steam-fiók összekapcsolása
- Steam-fiók leválasztása
- Steam kapcsolat állapotának megjelenítése
- Steam hibák kezelése és visszajelzése

A Steam összekapcsolás a Project Hubban kizárólag a Profil → Steam részen keresztül történik.

### 🔐 Hitelesítés

- 👤 regisztráció
- 🔑 bejelentkezés
- 🚪 kijelentkezés
- 🔄 munkamenet-ellenőrzés
- 🛡️ token alapú hitelesítés

### 📍 Helyek

- külön Helyek modul
- helyek alapvető kezelési felülete
- előkészítve a későbbi térképes és kedvences funkciókhoz

### 📱 Mobil / PWA

- 📱 iPhone / iOS támogatás
- 🤖 Android támogatás
- 🖥️ desktop reszponzivitás
- 📲 telepíthető PWA
- ☰ mobil hamburger navigáció
- 👆 jobb szélről húzva menü megnyitása
- ↔️ bal szélről húzva visszanavigálás támogatása
- ⬇️ pull-to-refresh tesztfunkció
- 📐 túlcsordulás és mobilos szövegilleszkedés javításai

> A gesztusok v1.3-ban tesztjellegűek, ezért a következő kiadásokban finomíthatók vagy bővíthetők.

### 🔄 Frissítési rendszer

- alkalmazásverzió megjelenítése
- pull-to-refresh visszajelzés
- PWA service worker frissítés
- új verzió esetén cache frissítése
- vizuális frissítési állapotok

### 🖥️ Fejlesztői Console

A desktopon használható fejlesztői diagnosztikai rendszer többek között megjeleníti:

- Project Hub verzió
- aktuális oldal
- URL
- online / offline állapot
- képernyőméret
- user agent
- hálózati hibák
- JavaScript hibák
- Promise hibák

## 🛠️ Technológiák

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- PostgreSQL
- Steam API / Steam OpenID
- GitHub Pages
- Render
- PWA / Service Worker

## 🗂️ Projektstruktúra

```text
Project-Hub-main/
├── index.html
├── script.js
├── style.css
├── pwa.css
├── debug.js
├── refresh.js
├── sw.js
├── manifest.webmanifest
├── icons/
├── pages/
│   ├── auth/
│   ├── profile/
│   ├── notes/
│   ├── tasks/
│   ├── games/
│   └── places/
└── backend/
    ├── server.js
    ├── database.js
    ├── config.js
    └── services/
```

## 🚀 v1.3 kiadás

A v1.3 a Project Hub első nagyobb, mobilközpontú mérföldköve. A kiadás fő fókusza a Games modul, a Steam-integráció, a Profil oldal, a PWA és az egységes mobilos felhasználói élmény.

### Stabilitási fókusz

- Steam callback és kapcsolási hibák kezelése
- Steam már másik Project Hub-fiókhoz kapcsolva állapot kezelése
- játéklista és achievement adatbetöltés hibakezelése
- mobilos szöveg- és kártya-túlcsordulás javítása
- PWA cache frissítés
- egységes verziójelölés

## 🔮 Következő tervek

### v1.4 — Stabilitás és finomhangolás

- további Steam edge case-ek kezelése
- mobil gesztusok véglegesítése
- PWA frissítési folyamat további finomítása
- UI/UX hibajavítások
- teljes mobilos regressziós teszt

### v1.5 — Games 2.0

- ⭐ kedvenc játékok
- saját értékelés
- játékstátuszok
- kategóriák
- „Játszani szeretnék” lista
- „Játszom” / „Végigjátszottam” állapotok
- bővített játékadatlap

### v1.6 — Cloud Sync

- ☁️ PostgreSQL-alapú tartós adatmentés
- felhasználónként elkülönített adatok
- jegyzetek szinkronizálása
- feladatok szinkronizálása
- saját játékok szinkronizálása
- több eszköz közötti adatmegosztás

### v1.7 — Helyek 2.0

- 🗺️ térképes megjelenítés
- 📌 helyek mentése
- ⭐ kedvencek
- 🏷️ kategóriák
- részletes helyoldal

### 2.0 — Project Hub teljes személyes központ

Hosszabb távon a Project Hub célja egyetlen személyes rendszer létrehozása a következő fő területekkel:

```text
🏠 Főoldal
├── 📝 Jegyzetek
├── ✅ Feladatok
├── 🎮 Játékok
│   ├── Steam
│   └── Egyéni könyvtár
├── 📍 Helyek
├── 👤 Profil
└── ⚙️ Beállítások
```

## 📌 Projekt állapota

🟢 **v1.3 — kiadásra előkészítve**

A Project Hub aktív fejlesztés alatt áll. A verziószámokat a projekt minden felhasználói és fejlesztői felületén egységesen kezeljük.
