// =========================================
// PROJECT HUB - GAMES
// Steam könyvtár megjelenítése.
// A Steam összekapcsolás kizárólag a Profil oldalon érhető el.
// =========================================

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    const BACKEND_URL = "https://project-hub-backend-1.onrender.com";
    const BLACKLIST_KEY = "steamGameBlacklist";

    const gamesList = document.getElementById("gamesList");
    const gamesControls = document.getElementById("gamesControls");
    const searchInput = document.getElementById("gamesSearchInput");
    const libraryMeta = document.getElementById("libraryMeta");
    const steamAccountStatus = document.getElementById("steamAccountStatus");
    const steamAccountAvatar = document.getElementById("steamAccountAvatar");
    const refreshButton = document.getElementById("refreshGamesButton");

    const modal = document.getElementById("gameDetailsModal");
    const modalOverlay = document.querySelector(".game-details-overlay");
    const closeButton = document.getElementById("closeGameDetailsButton");
    const detailsImage = document.getElementById("gameDetailsImage");
    const detailsTitle = document.getElementById("gameDetailsTitle");
    const detailsPlaytime = document.getElementById("gameDetailsPlaytime");
    const detailsHours = document.getElementById("gameDetailsHours");
    const detailsAchievementCount = document.getElementById("gameDetailsAchievementCount");
    const achievementsList = document.getElementById("gameAchievements");

    let allGames = [];
    let currentSort = "playtime";

    function token() {
        return localStorage.getItem("projectHubAuthToken");
    }

    function headers() {
        return {
            "Authorization": "Bearer " + token(),
            "Content-Type": "application/json"
        };
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function showAuthError() {
        localStorage.removeItem("projectHubAuthToken");
        sessionStorage.setItem("projectHubAuthMessage", "🔐 A munkameneted lejárt. Kérlek jelentkezz be újra.");
        window.location.href = "../auth/login.html";
    }

    function blacklist() {
        try {
            const value = JSON.parse(localStorage.getItem(BLACKLIST_KEY) || "[]");
            return Array.isArray(value) ? value.map(String) : [];
        } catch (_) {
            return [];
        }
    }

    function saveBlacklist(list) {
        localStorage.setItem(BLACKLIST_KEY, JSON.stringify(list));
    }

    function isHidden(appid) {
        return blacklist().includes(String(appid));
    }

    function hideGame(appid) {
        const list = blacklist();
        const id = String(appid);
        if (!list.includes(id)) list.push(id);
        saveBlacklist(list);
    }

    function getMinutes(game) {
        return Number(game.playtime_forever ?? game.playtimeForever ?? 0) || 0;
    }

    function getRecentMinutes(game) {
        return Number(game.playtime_2weeks ?? game.playtime2Weeks ?? 0) || 0;
    }

    function formatPlaytime(minutes) {
        const value = Math.max(0, Number(minutes) || 0);
        const hours = Math.floor(value / 60);
        const mins = value % 60;
        if (!hours) return mins + " perc";
        if (!mins) return hours + " óra";
        return hours + " óra " + mins + " perc";
    }

    function formatHours(minutes) {
        const value = Math.max(0, Number(minutes) || 0);
        if (!value) return "0 óra";
        if (value < 60) return Math.round(value) + " perc";
        return (value / 60).toFixed(1) + " óra";
    }

    function gameImage(game) {
        if (game.header_image) return game.header_image;
        if (game.images && game.images.header) return game.images.header;
        if (game.img_logo_url) return "https://cdn.cloudflare.steamstatic.com/steam/apps/" + game.appid + "/" + game.img_logo_url;
        if (game.img_icon_url) return "https://media.steampowered.com/steamcommunity/public/images/apps/" + game.appid + "/" + game.img_icon_url + ".jpg";
        if (game.appid) return "https://cdn.cloudflare.steamstatic.com/steam/apps/" + game.appid + "/header.jpg";
        return "";
    }

    function setState(type, title, message) {
        const icon = type === "error" ? "!" : type === "empty" ? "🎮" : "◌";
        gamesList.innerHTML = `<div class="games-state ${type}-state"><span class="state-icon">${icon}</span><strong>${escapeHtml(title)}</strong>${message ? `<p>${escapeHtml(message)}</p>` : ""}</div>`;
    }

    function normalizeGame(game) {
        return {
            ...game,
            appid: game.appid,
            name: game.name || "Ismeretlen játék",
            playtime_forever: getMinutes(game),
            playtime_2weeks: getRecentMinutes(game)
        };
    }

    async function loadSteamAccount() {
        try {
            const response = await fetch(BACKEND_URL + "/api/steam/account", {
                method: "GET",
                headers: headers(),
                credentials: "include"
            });
            if (response.status === 401) return showAuthError();
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "A Steam-kapcsolat nem ellenőrizhető.");

            if (!result.success || !result.connected || !result.account) {
                steamAccountStatus.textContent = "Nincs Steam-fiók összekötve. A kapcsolatot a Profil → Steam résznél tudod beállítani.";
                steamAccountAvatar.textContent = "🔗";
                gamesControls.style.display = "none";
                setState("empty", "Nincs Steam-fiók összekötve", "A Steam összekapcsolását kizárólag a Profil oldalon tudod elindítani.");
                return false;
            }

            const account = result.account;
            const name = account.personaName || account.steamName || account.steam_name || account.personaname || "Steam felhasználó";
            const avatar = account.avatarUrl || account.avatar || account.avatar_url || account.avatarfull || account.avatarmedium;
            steamAccountStatus.textContent = name + " · Steam-fiók összekötve";
            if (avatar) {
                steamAccountAvatar.innerHTML = `<img src="${escapeHtml(avatar)}" alt="Steam profilkép">`;
            } else {
                steamAccountAvatar.textContent = "🎮";
            }
            return true;
        } catch (error) {
            console.error("Steam account error:", error);
            steamAccountStatus.textContent = "A Steam-kapcsolat ellenőrzése sikertelen.";
            setState("error", "Nem sikerült ellenőrizni a Steam-kapcsolatot", "Próbáld újratölteni az oldalt.");
            return false;
        }
    }

    async function loadGames() {
        setState("loading", "Steam játékok betöltése...");
        refreshButton.disabled = true;
        try {
            const response = await fetch(BACKEND_URL + "/api/steam/games", {
                method: "GET",
                headers: headers(),
                credentials: "include"
            });
            if (response.status === 401) return showAuthError();
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Nem sikerült betölteni a Steam játékokat.");
            if (!result.success || !Array.isArray(result.games)) throw new Error("Nem érkezett megfelelő játéklista.");

            allGames = result.games.map(normalizeGame);
            gamesControls.style.display = "flex";
            renderGames();
        } catch (error) {
            console.error("Steam games error:", error);
            setState("error", "Nem sikerült betölteni a játékokat", error.message || "Próbáld újra később.");
            libraryMeta.textContent = "A játéklista jelenleg nem érhető el.";
        } finally {
            refreshButton.disabled = false;
        }
    }

    function sortedGames(games) {
        return [...games].sort((a, b) => {
            if (currentSort === "name") return a.name.localeCompare(b.name, "hu", { sensitivity: "base" });
            if (currentSort === "recent") return getRecentMinutes(b) - getRecentMinutes(a) || getMinutes(b) - getMinutes(a);
            return getMinutes(b) - getMinutes(a);
        });
    }

    function renderGames() {
        const query = (searchInput.value || "").trim().toLocaleLowerCase("hu-HU");
        const visible = sortedGames(allGames.filter(game => !isHidden(game.appid) && (!query || game.name.toLocaleLowerCase("hu-HU").includes(query))));
        const hiddenCount = allGames.filter(game => isHidden(game.appid)).length;

        libraryMeta.textContent = visible.length + " megjelenített játék" + (hiddenCount ? " · " + hiddenCount + " elrejtve" : "");

        if (!visible.length) {
            setState("empty", query ? "Nincs találat" : "Nincs megjeleníthető játék", query ? "Próbálj másik keresést." : "A profilodban elrejtett játékokat később vissza tudod állítani.");
            return;
        }

        gamesList.innerHTML = "";
        const fragment = document.createDocumentFragment();

        visible.forEach(game => {
            const card = document.createElement("article");
            card.className = "game-card";
            card.tabIndex = 0;
            const image = gameImage(game);
            const recent = getRecentMinutes(game);
            card.innerHTML = `
                <div class="game-card-media">
                    ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(game.name)}" loading="lazy">` : `<div class="game-card-placeholder">🎮</div>`}
                    <div class="game-card-gradient"></div>
                    <button class="game-hide-button" type="button" aria-label="${escapeHtml(game.name)} elrejtése" title="Játék elrejtése">•••</button>
                    ${recent ? `<span class="recent-badge">${escapeHtml(formatPlaytime(recent))} az elmúlt 2 hétben</span>` : ""}
                </div>
                <div class="game-card-body">
                    <h3>${escapeHtml(game.name)}</h3>
                    <div class="game-card-meta"><span>⏱</span><strong>${escapeHtml(formatPlaytime(getMinutes(game)))}</strong></div>
                </div>`;

            card.addEventListener("click", () => openDetails(game));
            card.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openDetails(game);
                }
            });
            card.querySelector(".game-hide-button").addEventListener("click", event => {
                event.stopPropagation();
                if (!confirm(`„${game.name}” elrejtése?`)) return;
                hideGame(game.appid);
                renderGames();
            });
            fragment.appendChild(card);
        });
        gamesList.appendChild(fragment);
    }

    async function openDetails(game) {
        const image = gameImage(game);
        detailsTitle.textContent = game.name;
        detailsPlaytime.textContent = "⏱ " + formatPlaytime(getMinutes(game));
        detailsHours.textContent = formatHours(getMinutes(game));
        detailsAchievementCount.textContent = "Betöltés...";
        achievementsList.innerHTML = `<div class="games-state loading-state">🏆 Achievementek betöltése...</div>`;
        if (image) {
            detailsImage.src = image;
            detailsImage.alt = game.name;
            detailsImage.style.display = "block";
        } else {
            detailsImage.removeAttribute("src");
            detailsImage.style.display = "none";
        }
        modal.hidden = false;
        document.body.classList.add("modal-open");

        try {
            const response = await fetch(BACKEND_URL + "/api/steam/game/" + encodeURIComponent(game.appid), {
                method: "GET",
                headers: headers(),
                credentials: "include"
            });
            if (response.status === 401) return showAuthError();
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Nem sikerült betölteni az achievementeket.");
            const achievements = Array.isArray(result.achievements) ? result.achievements : [];
            renderAchievements(achievements);
        } catch (error) {
            console.error("Game details error:", error);
            detailsAchievementCount.textContent = "Nem elérhető";
            achievementsList.innerHTML = `<div class="games-state error-state"><span class="state-icon">!</span><strong>Az achievementek nem tölthetők be.</strong><p>${escapeHtml(error.message || "Próbáld újra később.")}</p></div>`;
        }
    }

    function renderAchievements(achievements) {
        if (!achievements.length) {
            detailsAchievementCount.textContent = "0 / 0";
            achievementsList.innerHTML = `<div class="games-state empty-state"><span class="state-icon">🏆</span><strong>Nincs elérhető achievement adat.</strong></div>`;
            return;
        }
        const unlocked = achievements.filter(item => item.achieved === 1 || item.achieved === true).length;
        detailsAchievementCount.textContent = unlocked + " / " + achievements.length;
        achievementsList.innerHTML = "";
        achievements.forEach(item => {
            const unlockedItem = item.achieved === 1 || item.achieved === true;
            const row = document.createElement("div");
            row.className = "achievement-row " + (unlockedItem ? "unlocked" : "locked");
            const icon = item.icon || item.icongray || "";
            row.innerHTML = `
                ${icon ? `<img src="${escapeHtml(icon)}" alt="" loading="lazy">` : `<div class="achievement-placeholder">🏆</div>`}
                <div class="achievement-copy">
                    <strong>${escapeHtml(item.name || item.displayName || item.apiname || "Achievement")}</strong>
                    ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
                </div>
                <span class="achievement-status">${unlockedItem ? "Feloldva" : "Zárolva"}</span>`;
            achievementsList.appendChild(row);
        });
    }

    function closeDetails() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
    }

    refreshButton.addEventListener("click", loadGames);
    searchInput.addEventListener("input", renderGames);
    document.querySelectorAll(".filter-button").forEach(button => {
        button.addEventListener("click", () => {
            currentSort = button.dataset.sort || "playtime";
            document.querySelectorAll(".filter-button").forEach(item => item.classList.toggle("active", item === button));
            renderGames();
        });
    });
    closeButton.addEventListener("click", closeDetails);
    modalOverlay.addEventListener("click", closeDetails);
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) closeDetails();
    });

    (async function init() {
        const connected = await loadSteamAccount();
        if (connected) await loadGames();
    })();
});
