(function () {
    "use strict";

    const list = document.getElementById("notificationsList");
    const empty = document.getElementById("notificationsEmpty");
    const count = document.getElementById("notificationCount");
    const unread = document.getElementById("notificationUnread");

    function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleString("hu-HU", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    }

    function render() {
        const items = window.ProjectHubNotifications.getInbox();
        const unreadCount = items.filter(function (item) { return !item.read; }).length;

        count.textContent = items.length + (items.length === 1 ? " értesítés" : " értesítés");
        unread.textContent = unreadCount + " olvasatlan";
        list.innerHTML = "";
        empty.style.display = items.length ? "none" : "block";

        items.forEach(function (item) {
            const article = document.createElement("article");
            article.className = "notification-item" + (item.read ? "" : " unread");

            const icon = document.createElement("div");
            icon.className = "notification-icon";
            icon.innerHTML = item.type === "task-reminder"
                ? '<i class="fi fi-br-calendar-clock" aria-hidden="true"></i>'
                : '<i class="fi fi-br-bell" aria-hidden="true"></i>';

            const content = document.createElement("div");
            content.className = "notification-content";

            const title = document.createElement("h3");
            title.textContent = item.title || "Értesítés";

            const body = document.createElement("p");
            body.textContent = item.body || item.detail || "";

            const detail = document.createElement("small");
            detail.textContent = item.detail
                ? item.detail + " · " + formatDate(item.createdAt)
                : formatDate(item.createdAt);

            content.appendChild(title);
            content.appendChild(body);
            content.appendChild(detail);

            const status = document.createElement("span");
            status.className = "notification-status";
            status.setAttribute("aria-label", item.read ? "Olvasott" : "Olvasatlan");

            article.appendChild(icon);
            article.appendChild(content);
            article.appendChild(status);

            article.addEventListener("click", function () {
                if (!item.read) {
                    window.ProjectHubNotifications.markInboxRead(item.id);
                    render();
                }
            });

            list.appendChild(article);
        });
    }

    document.getElementById("markAllRead").addEventListener("click", function () {
        window.ProjectHubNotifications.markAllInboxRead();
        render();
    });

    document.getElementById("clearNotifications").addEventListener("click", function () {
        if (confirm("Biztosan törlöd az összes értesítést?")) {
            window.ProjectHubNotifications.clearInbox();
            render();
        }
    });

    window.addEventListener("storage", render);
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) render();
    });

    render();
})();
