const router = require("express").Router();
const {
    getBearerToken,
    getUserFromAuthToken
} = require("../middleware/auth");
const { addClient, removeClient } = require("../services/notifications");

// ======================================================
// NOTIFICATIONS - SSE STREAM
// Az EventSource nem tud Authorization fejlécet küldeni,
// ezért a token érkezhet ?token= query paraméterben is.
// ======================================================

router.get("/api/notifications/stream", async function (req, res) {

    try {

        const token =
            getBearerToken(req) ||
            (typeof req.query.token === "string" ? req.query.token : null);

        const user = await getUserFromAuthToken(token);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Érvényes bejelentkezés szükséges az értesítésekhez."
            });
        }

        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        });

        res.write("retry: 5000\n\n");
        res.write("event: ready\ndata: {}\n\n");

        addClient(user.id, res);

        // Keep-alive, hogy a proxy (Render) ne zárja le a kapcsolatot
        const ping = setInterval(function () {
            res.write(": ping\n\n");
        }, 25000);

        req.on("close", function () {
            clearInterval(ping);
            removeClient(user.id, res);
        });

    } catch (error) {
        console.error("NOTIFICATIONS STREAM HIBA:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Az értesítési csatorna nem nyitható meg."
            });
        }
    }
});

module.exports = router;
