const webpush = require("web-push");
const { pool } = require("../database");

const VAPID_PUBLIC_KEY = String(process.env.VAPID_PUBLIC_KEY || "").trim();
const VAPID_PRIVATE_KEY = String(process.env.VAPID_PRIVATE_KEY || "").trim();
const VAPID_SUBJECT = String(process.env.VAPID_SUBJECT || "mailto:admin@example.com").trim();

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

function isPushConfigured() {
    return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

async function sendPushToUser(userId, payload) {
    if (!isPushConfigured()) return { sent: 0, skipped: true };

    const result = await pool.query(
        "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1",
        [userId]
    );

    let sent = 0;
    for (const subscription of result.rows) {
        try {
            await webpush.sendNotification({
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth }
            }, JSON.stringify(payload), { TTL: 3600 });
            sent += 1;
        } catch (error) {
            if (error.statusCode === 404 || error.statusCode === 410) {
                await pool.query("DELETE FROM push_subscriptions WHERE id = $1", [subscription.id]);
            } else {
                console.error("WEB PUSH KÉZBESÍTÉSI HIBA:", error.message);
            }
        }
    }

    return { sent, skipped: false };
}

async function processTaskReminders() {
    if (!isPushConfigured()) return;

    const result = await pool.query(`
        SELECT id, user_id, title, due_date, reminder_minutes
        FROM tasks
        WHERE completed = FALSE
          AND due_date IS NOT NULL
          AND reminder_minutes IS NOT NULL
          AND reminder_minutes >= 0
          AND reminder_sent_at IS NULL
          AND due_date - (reminder_minutes * INTERVAL '1 minute') <= CURRENT_TIMESTAMP
          AND due_date >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        ORDER BY due_date ASC
        LIMIT 100
    `);

    for (const task of result.rows) {
        const pushResult = await sendPushToUser(task.user_id, {
            title: "Project Hub — feladat emlékeztető",
            body: task.title + " hamarosan esedékes.",
            url: "/Project-Hub/pages/tasks/tasks.html",
            tag: "project-hub-task-" + task.id,
            taskId: task.id
        });

        if (pushResult.sent > 0) {
            await pool.query(
                "UPDATE tasks SET reminder_sent_at = CURRENT_TIMESTAMP WHERE id = $1 AND reminder_sent_at IS NULL",
                [task.id]
            );
        }
    }
}

module.exports = { isPushConfigured, sendPushToUser, processTaskReminders, VAPID_PUBLIC_KEY };
