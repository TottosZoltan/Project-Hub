# Project Hub Backend – modularized

This folder is a modular split of the uploaded `server.js`. The route logic was kept from the original file; the main structural cleanup is that the application is now split into database, auth, Steam service, and route modules.

## Structure

- `server.js` – app setup, CORS, session, route mounting, startup
- `config.js` – backend/frontend/Steam configuration
- `database.js` – PostgreSQL pool
- `services/databaseInit.js` – original database initialization functions
- `services/steam.js` – Steam helper functions
- `middleware/auth.js` – auth token/user helpers and owner tag
- `routes/system.js` – database test + basic route
- `routes/auth.js` – register, login, `/api/auth/me`
- `routes/notes.js` – notes CRUD
- `routes/tasks.js` – tasks CRUD
- `routes/steam.js` – Steam linking/account/games/profile/recent games routes

## Important

The uploaded backend already contains the `users.profile_image` column, but it does not currently contain the `/api/profile` avatar routes. Those are therefore not invented here.

Before replacing the Render backend, keep a backup of the current working `server.js`. Deploy this modular version only after testing it locally or on a separate branch.

## Dinamikus értesítések (Dynamic Island stílus)

Az `rit3zh/expo-dynamic-notifications` ötlete alapján webre átalakítva (az eredeti React Native/Skia sablon, nem használható Node backendben).

- `services/notifications.js` – felhasználónkénti SSE kapcsolatok, `publish(userId, notification)`
- `routes/notifications.js` – `GET /api/notifications/stream` (Bearer fejléc vagy `?token=`)
- `public/dynamic-notifications.js` – függőség nélküli kliens modul, a backend szolgálja ki: `/dynamic-notifications.js`
- Értesítést küld: jegyzet és feladat létrehozás / módosítás / törlés

Frontend:

```html
<script src="https://project-hub-backend-1.onrender.com/dynamic-notifications.js"></script>
<script>
  DynamicNotifications.connect({ token: localStorage.getItem("authToken") });
  // kézi hívás:
  DynamicNotifications.trigger({ title: "Szia", message: "Teszt", symbol: "✓", accent: "#2F9BFF" });
</script>
```

Mezők: `title`, `message`, `avatar`, `symbol`, `accent`, `duration` (ms, `null` = marad), `onPress`, `render`.
