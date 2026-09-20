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
    const steamLibraryTab = document.getElementById("steamLibraryTab");
    const customLibraryTab = document.getElementById("customLibraryTab");
    const libraryTitle = document.getElementById("libraryTitle");
    const libraryEyebrow = document.getElementById("libraryEyebrow");
    const addCustomGameButton = document.getElementById("addCustomGameButton");
    const customGamesList = document.getElementById("customGamesList");
    const gamesLibraryViewport = document.getElementById("gamesLibraryViewport");
    const gamesLibraryTrack = document.getElementById("gamesLibraryTrack");
    const customGameModal = document.getElementById("customGameModal");
    const customGameOverlay = document.querySelector(".custom-game-overlay");
    const customGameForm = document.getElementById("customGameForm");
    const closeCustomGameButton = document.getElementById("closeCustomGameButton");
    const cancelCustomGameButton = document.getElementById("cancelCustomGameButton");
    const customGameName = document.getElementById("customGameName");
    const customGameImage = document.getElementById("customGameImage");
    const customGameMinutes = document.getElementById("customGameMinutes");
    const CUSTOM_LIBRARY_KEY = "projectHubCustomGames";
    const CUSTOM_API = BACKEND_URL + "/api/library/games";
    const customGameStatus = document.getElementById("customGameStatus");
    const customGameFavorite = document.getElementById("customGameFavorite");
    const customGameSubmit = customGameForm ? customGameForm.querySelector('button[type="submit"]') : null;
    let editingCustomId = null;

    const modal = document.getElementById("gameDetailsModal");
    const modalOverlay = document.querySelector(".game-details-overlay");
    const closeButton = document.getElementById("closeGameDetailsButton");
    const detailsImage = document.getElementById("gameDetailsImage");
    const detailsTitle = document.getElementById("gameDetailsTitle");
    const detailsPlaytime = document.getElementById("gameDetailsPlaytime");
    const detailsHours = document.getElementById("gameDetailsHours");
    const detailsAchievementCount = document.getElementById("gameDetailsAchievementCount");
    const achievementsList = document.getElementById("gameAchievements");
    const detailsInfoList = document.getElementById("gameDetailsInfo");
    const detailsStoreLink = document.getElementById("gameDetailsStoreLink");

    let allGames = [];
    let currentSort = "playtime";
    let activeLibrary = "steam";

    function customGames() {
        try {
            const value = JSON.parse(localStorage.getItem(CUSTOM_LIBRARY_KEY) || "[]");
            return Array.isArray(value) ? value : [];
        } catch (_) {
            return [];
        }
    }

    function saveCustomGames(list) { localStorage.setItem(CUSTOM_LIBRARY_KEY, JSON.stringify(list)); }

    async function syncCustomGames() {
        try {
            const response = await fetch(CUSTOM_API, { headers: headers(), credentials: "include" });
            if (response.status === 401) return showAuthError();
            if (!response.ok) throw new Error("sync_failed");
            const result = await response.json();
            if (result.success && Array.isArray(result.games)) {
                const localList = customGames();
                if (!result.games.length && localList.length) {
                    const uploaded=[];
                    for (const item of localList) { const saved=await saveCustomGameCloud(item, null); if(saved) uploaded.push(saved); }
                    if(uploaded.length){ saveCustomGames(uploaded); return uploaded; }
                }
                saveCustomGames(result.games); return result.games;
            }
        } catch (error) { console.warn("Saját játékok cloud sync sikertelen:", error); }
        return customGames();
    }

    async function saveCustomGameCloud(game, existingId) {
        try {
            const response = await fetch(existingId ? CUSTOM_API + "/" + encodeURIComponent(existingId) : CUSTOM_API, {
                method: existingId ? "PATCH" : "POST", headers: headers(), credentials: "include", body: JSON.stringify(game)
            });
            if (response.status === 401) return showAuthError();
            if (!response.ok) throw new Error("save_failed");
            const result = await response.json();
            return result.game || null;
        } catch (error) { console.warn("Saját játék mentése cloudba sikertelen:", error); return null; }
    }

    function setLibrary(library) {
        activeLibrary = library === "custom" ? "custom" : "steam";
        const custom = activeLibrary === "custom";
        steamLibraryTab.classList.toggle("active", !custom);
        customLibraryTab.classList.toggle("active", custom);
        steamLibraryTab.setAttribute("aria-selected", String(!custom));
        customLibraryTab.setAttribute("aria-selected", String(custom));
        gamesLibraryTrack.style.transform = `translateX(${custom ? "-50%" : "0"})`;
        libraryEyebrow.textContent = custom ? "EGYÉB JÁTÉKAID" : "STEAM KÖNYVTÁR";
        libraryTitle.textContent = custom ? "Egyéb játékaid" : "Steam játékaid";
        addCustomGameButton.hidden = !custom;
        refreshButton.hidden = custom;
        gamesControls.style.display = custom ? "none" : (allGames.length ? "flex" : "none");
        if (custom) renderCustomGames();
    }

    function openCustomGameModal(game = null) {
        editingCustomId = game?.id ?? null;
        customGameForm.reset();
        document.getElementById("customGameTitle").textContent = game ? "Játék szerkesztése" : "Játék hozzáadása";
        customGameName.value = game?.name || "";
        customGameImage.value = game?.image || "";
        customGameMinutes.value = game?.minutes || 0;
        if (customGameStatus) customGameStatus.value = game?.status || "backlog";
        if (customGameFavorite) customGameFavorite.checked = !!game?.favorite;
        if (customGameSubmit) customGameSubmit.textContent = game ? "Mentés" : "Hozzáadás";
        customGameModal.hidden = false;
        document.body.classList.add("modal-open");
        setTimeout(() => customGameName.focus(), 30);
    }

    function closeCustomGameModal() {
        customGameModal.hidden = true;
        document.body.classList.remove("modal-open");
    }

    function renderCustomGames() {
        const games = customGames();
        libraryMeta.textContent = games.length + (games.length === 1 ? " egyéb játék" : " egyéb játék");
        if (!games.length) { customGamesList.innerHTML = `<div class="games-state empty-state"><span class="state-icon"><i class="fi fi-br-gamepad" aria-hidden="true"></i></span><strong>Még nincs egyéb játékod.</strong><p>Adj hozzá egy játékot, és az „Egyéb játékaid” között fog megjelenni.</p></div>`; return; }
        customGamesList.innerHTML = ""; const fragment = document.createDocumentFragment();
        const labels={backlog:"Játszani szeretném",playing:"Játszom",completed:"Végigjátszva"};
        games.forEach(game=>{
            const card=document.createElement("article"); card.className="game-card custom-game-card";
            const image=game.image||"", minutes=Number(game.minutes)||0;
            card.innerHTML=`<div class="game-card-media">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(game.name)}" loading="lazy">`:`<div class="game-card-placeholder">${escapeHtml(String(game.name||"?").slice(0,1).toUpperCase())}</div>`}<div class="game-card-gradient"></div><div class="custom-game-tools"><button class="custom-edit" type="button" title="Szerkesztés"><i class="fi fi-br-pencil" aria-hidden="true"></i></button><button class="custom-delete-button" type="button" title="Törlés"><i class="fi fi-br-cross" aria-hidden="true"></i></button></div></div><div class="game-card-body"><h3>${escapeHtml(game.name)}</h3><div class="game-card-meta"><strong>${escapeHtml(formatPlaytime(minutes))}</strong><span>${game.favorite?'<i class="fi fi-br-star" aria-hidden="true"></i> ':''}Egyéb játék</span></div><div class="custom-status">${escapeHtml(labels[game.status]||"Játszani szeretném")}</div></div>`;
            card.querySelector('.custom-edit').onclick=e=>{e.stopPropagation();openCustomGameModal(game)};
            card.querySelector('.custom-delete-button').onclick=async e=>{e.stopPropagation();if(!confirm(`„${game.name}” törlése az egyéb játékaid közül?`))return;saveCustomGames(customGames().filter(x=>String(x.id)!==String(game.id)));renderCustomGames();try{await fetch(CUSTOM_API+"/"+encodeURIComponent(game.id),{method:"DELETE",headers:headers(),credentials:"include"})}catch{}};
            fragment.appendChild(card);
        }); customGamesList.appendChild(fragment);
    }

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
        const icon = type === "error" ? "!" : type === "empty" ? `<i class="fi fi-br-gamepad" aria-hidden="true"></i>` : "◌";
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
                steamAccountAvatar.innerHTML = '<i class="fi fi-br-link" aria-hidden="true"></i>';
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
                steamAccountAvatar.innerHTML = '<i class="fi fi-br-gamepad" aria-hidden="true"></i>';
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
                    ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(game.name)}" loading="lazy">` : `<div class="game-card-placeholder"><i class="fi fi-br-gamepad" aria-hidden="true"></i></div>`}
                    <div class="game-card-gradient"></div>
                    <button class="game-hide-button" type="button" aria-label="${escapeHtml(game.name)} elrejtése" title="Játék elrejtése"><i class="fi fi-br-eye-crossed" aria-hidden="true"></i></button>
                    ${recent ? `<span class="recent-badge">${escapeHtml(formatPlaytime(recent))} az elmúlt 2 hétben</span>` : ""}
                </div>
                <div class="game-card-body">
                    <h3>${escapeHtml(game.name)}</h3>
                    <div class="game-card-meta"><span><i class="fi fi-br-clock" aria-hidden="true"></i></span><strong>${escapeHtml(formatPlaytime(getMinutes(game)))}</strong></div>
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
        detailsPlaytime.innerHTML = '<i class="fi fi-br-clock" aria-hidden="true"></i> ' + escapeHtml(formatPlaytime(getMinutes(game)));
        detailsHours.textContent = formatHours(getMinutes(game));
        detailsAchievementCount.textContent = "Betöltés...";
        achievementsList.innerHTML = `<div class="games-state loading-state"><i class="fi fi-br-trophy" aria-hidden="true"></i> Achievementek betöltése...</div>`;
        detailsInfoList.innerHTML = `<div class="games-state loading-state"><i class="fi fi-br-info" aria-hidden="true"></i> További információk betöltése...</div>`;
        detailsStoreLink.hidden = true;
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
        setDetailsTab("overview");

        try {
            const response = await fetch(BACKEND_URL + "/api/steam/game/" + encodeURIComponent(game.appid), {
                method: "GET",
                headers: headers(),
                credentials: "include",
                cache: "no-store"
            });
            if (response.status === 401) return showAuthError();
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Nem sikerült betölteni a játék adatait.");
            const achievements = Array.isArray(result.achievements) ? result.achievements : [];
            renderAchievements(achievements);
            renderGameInfo(result.game || {}, result.store || {});
        } catch (error) {
            console.error("Game details error:", error);
            detailsAchievementCount.textContent = "Nem elérhető";
            achievementsList.innerHTML = `<div class="games-state error-state"><span class="state-icon">!</span><strong>A részletek nem tölthetők be.</strong><p>${escapeHtml(error.message || "Próbáld újra később.")}</p></div>`;
            detailsInfoList.innerHTML = `<div class="games-state error-state"><span class="state-icon">!</span><strong>Az egyéb információk nem tölthetők be.</strong><p>Próbáld újra megnyitni a játékot.</p></div>`;
        }
    }

    function renderGameInfo(game, store) {
        const rows = [
            ["Fejlesztő", Array.isArray(store.developers) ? store.developers.join(", ") : "Nem elérhető"],
            ["Kiadó", Array.isArray(store.publishers) ? store.publishers.join(", ") : "Nem elérhető"],
            ["Megjelenés", store.releaseDate || "Nem elérhető"],
            ["Műfaj", Array.isArray(store.genres) ? store.genres.join(", ") : "Nem elérhető"],
            ["Játékidő", formatPlaytime(game.playtimeForever || 0)],
            ["Utolsó 2 hét", formatPlaytime(game.playtime2Weeks || 0)],
            ["Achievementek", store.achievementCount != null ? String(store.achievementCount) : "Nem elérhető"]
        ];
        detailsInfoList.innerHTML = rows.map(([label, value]) => `<div class="game-info-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
        if (store.storeUrl) {
            detailsStoreLink.href = store.storeUrl;
            detailsStoreLink.hidden = false;
        }
    }

    function setDetailsTab(tab) {
        document.querySelectorAll("[data-details-tab]").forEach(button => button.classList.toggle("active", button.dataset.detailsTab === tab));
        document.querySelectorAll("[data-details-panel]").forEach(panel => panel.hidden = panel.dataset.detailsPanel !== tab);
    }

    function renderAchievements(achievements) {
        if (!achievements.length) {
            detailsAchievementCount.textContent = "0 / 0";
            achievementsList.innerHTML = `<div class="games-state empty-state"><span class="state-icon"><i class="fi fi-br-trophy" aria-hidden="true"></i></span><strong>Nincs elérhető achievement adat.</strong></div>`;
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
                ${icon ? `<img src="${escapeHtml(icon)}" alt="" loading="lazy">` : `<div class="achievement-placeholder"><i class="fi fi-br-trophy" aria-hidden="true"></i></div>`}
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

    steamLibraryTab.addEventListener("click", () => setLibrary("steam"));
    customLibraryTab.addEventListener("click", () => setLibrary("custom"));
    addCustomGameButton.addEventListener("click", openCustomGameModal);
    closeCustomGameButton.addEventListener("click", closeCustomGameModal);
    cancelCustomGameButton.addEventListener("click", closeCustomGameModal);
    customGameOverlay.addEventListener("click", closeCustomGameModal);
    customGameForm.addEventListener("submit", async event => {
        event.preventDefault(); const name=customGameName.value.trim(); if(!name)return;
        const payload={name,image:customGameImage.value.trim(),minutes:Math.max(0,Number(customGameMinutes.value)||0),status:customGameStatus?.value || "backlog",favorite:!!customGameFavorite?.checked};
        const games=customGames();
        if(editingCustomId){ const item=games.find(x=>String(x.id)===String(editingCustomId)); if(item)Object.assign(item,payload); saveCustomGames(games); }
        else { const localItem={id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),...payload}; games.unshift(localItem); saveCustomGames(games); }
        const saved=await saveCustomGameCloud(payload, editingCustomId && !String(editingCustomId).startsWith("local-") ? editingCustomId : null);
        if(saved){ const current=customGames(); if(editingCustomId){const i=current.findIndex(x=>String(x.id)===String(editingCustomId));if(i>=0)current[i]=saved;}else{current[0]=saved;} saveCustomGames(current); }
        editingCustomId=null; closeCustomGameModal(); renderCustomGames(); setLibrary("custom");
    });

    let touchStartX = 0;
    let touchStartY = 0;
    gamesLibraryViewport.addEventListener("touchstart", event => {
        const touch = event.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: true });
    gamesLibraryViewport.addEventListener("touchend", event => {
        const touch = event.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
        setLibrary(dx < 0 ? "custom" : "steam");
    }, { passive: true });

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
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !customGameModal.hidden) closeCustomGameModal();
    });
    document.querySelectorAll("[data-details-tab]").forEach(button => {
        button.addEventListener("click", () => setDetailsTab(button.dataset.detailsTab));
    });
    modalOverlay.addEventListener("click", closeDetails);
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) closeDetails();
    });

    setLibrary("steam");

    (async function init() {
        await syncCustomGames();
        renderCustomGames();
        const connected = await loadSteamAccount();
        if (connected) await loadGames();
    })();
});
