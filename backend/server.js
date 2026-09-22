const express = require("express");
const cors = require("cors");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);

const { pool } = require("./database");
const { PORT, FRONTEND_URL } = require("./config");
const { initializeDatabase, initializeTasksDatabase } = require("./services/databaseInit");

const authRoutes = require("./routes/auth");
const systemRoutes = require("./routes/system");
const notesRoutes = require("./routes/notes");
const tasksRoutes = require("./routes/tasks");
const steamRoutes = require("./routes/steam");
const libraryRoutes = require("./routes/library");
const notificationsRoutes = require("./routes/notifications");
const { processTaskReminders } = require("./services/push");

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "2mb"
    })
);

app.set("trust proxy", 1);

// ======================================================
// SESSION
// ======================================================

app.use(
    session({
        store: new PgSession({
            pool: pool,
            tableName: "sessions",
            createTableIfMissing: true
        }),
        secret:
            process.env.SESSION_SECRET ||
            "project-hub-development-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
            maxAge:
                1000 *
                60 *
                60 *
                24 *
                30
        }
    })
);

// ======================================================
// ROUTES
// ======================================================

app.use(systemRoutes);
app.use(authRoutes);
app.use(notesRoutes);
app.use(tasksRoutes);
app.use(steamRoutes);
app.use(libraryRoutes);
app.use(notificationsRoutes);

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
    function (error, req, res, next) {
        console.error("GLOBAL ERROR:", error);

        if (res.headersSent) {
            return next(error);
        }

        return res.status(500).json({
            success: false,
            message: "Belső szerverhiba."
        });
    }
);

// ======================================================
// START SERVER
// ======================================================

async function startServer() {
    setInterval(function () {
        processTaskReminders().catch(function (error) {
            console.error("TASK REMINDER WORKER HIBA:", error);
        });
    }, 30000);
    try {
        await initializeDatabase();
        await initializeTasksDatabase();

        app.listen(PORT, function () {
            console.log("=================================");
            console.log("PROJECT HUB BACKEND ELINDULT");
            console.log("Port:", PORT);
            console.log("Frontend:", FRONTEND_URL);
            console.log("=================================");
        });
    } catch (error) {
        console.error("A szerver indítása sikertelen:", error);
        process.exit(1);
    }
}

startServer();
