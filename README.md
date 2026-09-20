# Project Hub 1.5.2

A Project Hub egy személyes, mobil-first dashboard jegyzetekkel, feladatokkal, játékokkal, Steam-integrációval, saját játékkönyvtárral és helykezeléssel.

## 1.4 újdonságok

- 🎮 Egyéni játékok cloud mentése, szerkesztése, törlése
- ⭐ Kedvenc egyéni játékok
- 🎯 Egyéni játékállapotok
- 📍 Teljes Helyek modul
- 🔎 Helykeresés és kategóriaszűrés
- ⭐ Kedvenc helyek
- ☁️ PostgreSQL alapú felhasználói adatszinkronizáció a saját játékokhoz és helyekhez
- 📱 Mobilbarát modalok és gesztusbarát kezelőfelület
- 🔄 PWA frissítési rendszer 1.5.2

## Fő modulok

- 🏠 Dashboard
- 📝 Jegyzetek
- ✅ Feladatok
- 🎮 Steam játékok
- 📚 Egyéni játékok
- 🏆 Steam achievementek
- 📍 Helyek
- 👤 Profil
- 🔗 Steam kapcsolat
- 📱 PWA / iPhone
- 🖥️ Fejlesztői console

## Backend

A backend Node.js + Express + PostgreSQL alapú. A felhasználói adatok token alapú hitelesítéssel vannak leválasztva.

### Új 1.4 API-k

- `GET /api/library/games`
- `POST /api/library/games`
- `PATCH /api/library/games/:id`
- `DELETE /api/library/games/:id`
- `GET /api/places`
- `POST /api/places`
- `PATCH /api/places/:id`
- `DELETE /api/places/:id`

## Verzió

**Project Hub 1.5.2**
