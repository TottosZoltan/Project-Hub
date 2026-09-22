const express = require("express");
const { pool } = require("../database");
const { getAuthenticatedTasksUser } = require("../middleware/auth");
const { isPushConfigured, sendPushToUser, VAPID_PUBLIC_KEY } = require("../services/push");

const router = express.Router();

router.get("/api/notifications/vapid-public-key", function (req, res) {
    if (!isPushConfigured()) {
        return res.status(503).json({ success: false, configured: false, message: "A háttérértesítések még nincsenek konfigurálva." });
    }
    return res.json({ success: true, configured: true, publicKey: VAPID_PUBLIC_KEY });
});

router.post("/api/notifications/subscribe", async function (req, res) {
    try {
        const user = await getAuthenticatedTasksUser(req);
        if (!user) return res.status(401).json({ success: false, message: "Érvényes bejelentkezés szükséges." });
        if (!isPushConfigured()) return res.status(503).json({ success: false, message: "A háttérértesítések még nincsenek konfigurálva." });

        const subscription = req.body?.subscription;
        const endpoint = subscription?.endpoint;
        const p256dh = subscription?.keys?.p256dh;
        const auth = subscription?.keys?.auth;
        if (!endpoint || !p256dh || !auth) return res.status(400).json({ success: false, message: "Érvénytelen push subscription." });

        await pool.query(`
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (endpoint) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                updated_at = CURRENT_TIMESTAMP
        `, [user.id, endpoint, p256dh, auth]);

        return res.json({ success: true });
    } catch (error) {
        console.error("PUSH SUBSCRIBE HIBA:", error);
        return res.status(500).json({ success: false, message: "Nem sikerült menteni az értesítési kapcsolatot." });
    }
});

router.delete("/api/notifications/subscribe", async function (req, res) {
    try {
        const user = await getAuthenticatedTasksUser(req);
        if (!user) return res.status(401).json({ success: false, message: "Érvényes bejelentkezés szükséges." });
        const endpoint = String(req.body?.endpoint || "").trim();
        if (!endpoint) return res.status(400).json({ success: false, message: "Hiányzó subscription endpoint." });
        await pool.query("DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2", [user.id, endpoint]);
        return res.json({ success: true });
    } catch (error) {
        console.error("PUSH UNSUBSCRIBE HIBA:", error);
        return res.status(500).json({ success: false, message: "Nem sikerült törölni az értesítési kapcsolatot." });
    }
});

router.post("/api/notifications/test-push", async function (req, res) {
    try {
        const user = await getAuthenticatedTasksUser(req);
        if (!user) return res.status(401).json({ success: false, message: "Érvényes bejelentkezés szükséges." });
        const result = await sendPushToUser(user.id, {
            title: "Project Hub — teszt",
            body: "A háttérben futó értesítések működnek.",
            url: "/Project-Hub/pages/notifications/notifications.html",
            tag: "project-hub-test-" + Date.now()
        });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error("PUSH TEST HIBA:", error);
        return res.status(500).json({ success: false, message: "A push teszt sikertelen." });
    }
});

router.post("/api/notifications/test-push-delayed", async function (req, res) {
    try {
        const user = await getAuthenticatedTasksUser(req);
        if (!user) return res.status(401).json({ success: false, message: "Érvényes bejelentkezés szükséges." });
        if (!isPushConfigured()) return res.status(503).json({ success: false, message: "A háttérértesítések még nincsenek konfigurálva." });

        const result = await pool.query(`
            UPDATE push_subscriptions
            SET test_scheduled_at = CURRENT_TIMESTAMP + INTERVAL '1 minute',
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
            RETURNING id
        `, [user.id]);

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: "Előbb engedélyezd az értesítéseket." });
        }

        return res.json({ success: true, delaySeconds: 60 });
    } catch (error) {
        console.error("KÉSLELTETETT PUSH TESZT HIBA:", error);
        return res.status(500).json({ success: false, message: "A késleltetett teszt beállítása sikertelen." });
    }
});


router.get("/api/notifications/generate-vapid", function (req, res) {
    try {
        const webpush = require("web-push");
        const keys = webpush.generateVAPIDKeys();
        return res.type("html").send(
            "<!doctype html><html lang='hu'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Project Hub – VAPID kulcsok</title><style>body{margin:0;padding:24px;background:#080b12;color:#fff;font-family:Arial,sans-serif}.card{max-width:760px;margin:30px auto;background:#111622;border:1px solid #293248;border-radius:18px;padding:22px}label{display:block;margin:16px 0 7px;font-weight:700;font-size:13px}textarea{width:100%;box-sizing:border-box;background:#080b12;color:#fff;border:1px solid #35415a;border-radius:10px;padding:12px;font:12px monospace;min-height:90px}p{color:#aeb6c8;line-height:1.5}.ok{color:#79e2a0;font-weight:700}</style></head><body><div class='card'><h1>🔐 VAPID kulcsok elkészültek</h1><p class='ok'>✓ A kulcspár elkészült.</p><label>VAPID_PUBLIC_KEY</label><textarea readonly>" + keys.publicKey + "</textarea><label>VAPID_PRIVATE_KEY</label><textarea readonly>" + keys.privateKey + "</textarea><label>VAPID_SUBJECT</label><textarea readonly>mailto:admin@example.com</textarea><p>Render → Environment Variables alatt add meg ezt a három értéket. A private key-t kezeld titkos adatként.</p></div></body></html>"
        );
    } catch (error) {
        console.error("VAPID GENERÁLÁSI HIBA:", error);
        return res.status(500).json({ success: false, message: "A VAPID kulcsok generálása sikertelen." });
    }
});
module.exports = router;
