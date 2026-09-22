# Értesítések és feladat-emlékeztetők — 1.7.0

## Frontend

A Tasks modul most támogatja:
- határidő (dueDate)
- emlékeztető (reminderMinutes)
- lejárt határidő vizuális jelzését
- felhasználó által kapcsolható értesítéseket
- külön feladat-emlékeztető kapcsolót
- PWA service worker értesítési kezelést

Az értesítési engedélyt kizárólag felhasználói műveletből kérjük a Profil → Értesítések részen.

## Fontos backend követelmény

A telefonos értesítés akkor is, amikor a Project Hub nincs nyitva, Web Push + VAPID backend kézbesítést igényel. A jelenlegi frontend már fogadja a Web Push eseményt a sw.js service workerben, de a meglévő Render backend forrása nincs ebben a GitHub repositoryban, ezért a backend push subscription / VAPID végpontjait ebben a változásban nem lehet biztonságosan módosítani.

A backend oldalon szükséges:
1. VAPID kulcspár környezeti változóként.
2. Hitelesített endpoint a böngésző PushSubscription mentésére felhasználónként.
3. Endpoint a subscription törlésére.
4. Ütemezett worker/cron, amely a nem teljesített feladatok dueDate + reminderMinutes alapján küldi a push üzenetet.
5. A push payload tartalmazza legalább: title, body, url, tag.
6. A lejárt/érvénytelen subscription automatikus törlése.

A frontend a Tasks API-nak dueDate és reminderMinutes mezőket küld. A backendnek ezeket per-user módon kell tárolnia.

## Tesztelés

- A böngésző értesítési engedélye a Profil oldalon kezelhető.
- A feladat létrehozásakor a határidő és emlékeztető mezők elküldésre kerülnek.
- A service worker push eseményre értesítést jelenít meg.
- A teljes, app bezárt állapotában is működő telefonos emlékeztető a backend Web Push/VAPID integráció elkészülése után lesz teljes.
