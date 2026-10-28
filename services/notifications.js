// ======================================================
// ÉRTESÍTÉSEK - SSE kapcsolatok kezelése (felhasználónként)
// ======================================================

const clients = new Map(); // userId -> Set<res>

function addClient(userId, res) {
    if (!clients.has(userId)) {
        clients.set(userId, new Set());
    }
    clients.get(userId).add(res);
}

function removeClient(userId, res) {
    const set = clients.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) {
        clients.delete(userId);
    }
}

// Értesítés küldése egy felhasználó összes nyitott kapcsolatára
function publish(userId, notification) {
    const set = clients.get(userId);
    if (!set || set.size === 0) return;

    const payload = JSON.stringify({
        id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
        ...notification
    });

    for (const res of set) {
        try {
            res.write("event: notification\n");
            res.write("data: " + payload + "\n\n");
        } catch (error) {
            removeClient(userId, res);
        }
    }
}

module.exports = { addClient, removeClient, publish };
