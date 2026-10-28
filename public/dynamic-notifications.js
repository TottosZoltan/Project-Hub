/*!
 * dynamic-notifications.js
 * Dynamic Island stílusú értesítések (vanilla JS, függőség nélkül).
 * Az rit3zh/expo-dynamic-notifications ötlete alapján webre átalakítva.
 *
 * Használat:
 *   <script src="https://project-hub-backend-1.onrender.com/dynamic-notifications.js"></script>
 *   DynamicNotifications.connect({ token: "<auth token>" });   // szerver oldali események
 *   DynamicNotifications.trigger({ title: "Szia", message: "Teszt" }); // kézi hívás
 */
(function (global) {
    "use strict";

    var config = {
        apiUrl: "https://project-hub-backend-1.onrender.com",
        duration: 3600,          // ms, null = nem tűnik el magától
        accent: "#2F9BFF",
        islandWidth: 126,
        islandHeight: 37,
        islandTop: 11,
        islandColor: "#000000",
        cardWidth: 396,
        cardHeight: 74,
        cardColor: "#FFFFFF",
        textColor: "#10131C",
        mutedColor: "#6B7280",
        shadowColor: "rgba(16, 19, 28, 0.20)",
        zIndex: 2147483000,
        onDismiss: null
    };

    var els = null;          // { root, card, body }
    var current = null;
    var timer = null;
    var exitTimer = null;
    var source = null;
    var drag = null;

    function injectStyle() {
        if (document.getElementById("dn-style")) return;
        var style = document.createElement("style");
        style.id = "dn-style";
        style.textContent =
            ".dn-root{position:fixed;left:0;right:0;top:0;height:0;pointer-events:none;display:flex;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
            ".dn-card{position:absolute;top:var(--dn-top);width:var(--dn-iw);height:var(--dn-ih);border-radius:999px;background:var(--dn-island);box-shadow:0 0 0 rgba(0,0,0,0);overflow:hidden;opacity:0;transform:translateY(-12px) scale(.9);pointer-events:none;touch-action:none;" +
            "transition:width .5s cubic-bezier(.2,.9,.25,1.1),height .5s cubic-bezier(.2,.9,.25,1.1),transform .5s cubic-bezier(.2,.9,.25,1.1),background-color .35s ease,box-shadow .5s ease,opacity .2s ease,border-radius .5s ease}" +
            ".dn-card.dn-show{opacity:1;transform:translateY(0) scale(1)}" +
            ".dn-card.dn-open{width:var(--dn-cw);height:var(--dn-ch);transform:translateY(34px) scale(1);border-radius:calc(var(--dn-ch)/2);background:var(--dn-card);box-shadow:0 12px 32px var(--dn-shadow);pointer-events:auto;cursor:pointer}" +
            ".dn-card.dn-drag{transition:none}" +
            ".dn-body{position:absolute;inset:0;display:flex;align-items:center;gap:12px;padding:0 20px 0 14px;opacity:0;filter:blur(10px);transition:opacity .3s ease .12s,filter .35s ease .12s}" +
            ".dn-open .dn-body{opacity:1;filter:blur(0)}" +
            ".dn-avatar{width:46px;height:46px;border-radius:50%;object-fit:cover;flex:none;background:#e5e7eb}" +
            ".dn-texts{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}" +
            ".dn-title{font-weight:700;font-size:15px;line-height:1.2;color:var(--dn-accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
            ".dn-message{font-size:13px;line-height:1.25;color:var(--dn-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
            ".dn-symbol{flex:none;font-size:22px;line-height:1;color:var(--dn-accent)}" +
            "@media (prefers-reduced-motion:reduce){.dn-card,.dn-body{transition-duration:.01s!important;transition-delay:0s!important}}";
        document.head.appendChild(style);
    }

    function ensureDom() {
        if (els) return els;
        injectStyle();

        var root = document.createElement("div");
        root.className = "dn-root";
        root.style.zIndex = String(config.zIndex);
        root.setAttribute("aria-live", "polite");

        var card = document.createElement("div");
        card.className = "dn-card";
        card.setAttribute("role", "status");

        var body = document.createElement("div");
        body.className = "dn-body";

        card.appendChild(body);
        root.appendChild(card);
        document.body.appendChild(root);

        card.addEventListener("pointerdown", onPointerDown);
        card.addEventListener("pointermove", onPointerMove);
        card.addEventListener("pointerup", onPointerUp);
        card.addEventListener("pointercancel", onPointerUp);

        els = { root: root, card: card, body: body };
        return els;
    }

    function applyVars(n) {
        var cardW = Math.min(window.innerWidth - 32, config.cardWidth);
        var s = els.card.style;
        s.setProperty("--dn-top", config.islandTop + "px");
        s.setProperty("--dn-iw", config.islandWidth + "px");
        s.setProperty("--dn-ih", config.islandHeight + "px");
        s.setProperty("--dn-cw", cardW + "px");
        s.setProperty("--dn-ch", config.cardHeight + "px");
        s.setProperty("--dn-island", config.islandColor);
        s.setProperty("--dn-card", config.cardColor);
        s.setProperty("--dn-shadow", config.shadowColor);
        s.setProperty("--dn-accent", n.accent || config.accent);
        s.setProperty("--dn-muted", config.mutedColor);
        els.body.style.color = config.textColor;
    }

    function fill(n) {
        var body = els.body;
        while (body.firstChild) body.removeChild(body.firstChild);

        if (typeof n.render === "function") {
            var custom = n.render(n);
            if (custom instanceof Node) body.appendChild(custom);
            return;
        }

        if (n.avatar) {
            var img = document.createElement("img");
            img.className = "dn-avatar";
            img.alt = "";
            img.src = n.avatar;
            body.appendChild(img);
        }

        var texts = document.createElement("div");
        texts.className = "dn-texts";
        var title = document.createElement("div");
        title.className = "dn-title";
        title.textContent = n.title || "";
        texts.appendChild(title);
        if (n.message) {
            var msg = document.createElement("div");
            msg.className = "dn-message";
            msg.textContent = n.message;
            texts.appendChild(msg);
        }
        body.appendChild(texts);

        if (n.symbol) {
            var sym = document.createElement("div");
            sym.className = "dn-symbol";
            sym.textContent = n.symbol;
            body.appendChild(sym);
        }
    }

    function clearTimers() {
        clearTimeout(timer);
        clearTimeout(exitTimer);
        timer = exitTimer = null;
    }

    function trigger(n) {
        if (!n || typeof n !== "object") return;
        ensureDom();
        clearTimers();

        var card = els.card;
        var start = function () {
            current = n;
            card.style.transform = "";
            applyVars(n);
            fill(n);
            card.classList.remove("dn-open", "dn-drag");
            card.classList.add("dn-show");
            // a "sziget" először megjelenik, majd kinyílik kártyává
            setTimeout(function () {
                if (current === n) card.classList.add("dn-open");
            }, 60);

            var duration = n.duration !== undefined ? n.duration : config.duration;
            if (duration !== null && duration > 0) {
                timer = setTimeout(function () { dismiss(); }, duration);
            }
        };

        if (current) {
            // meglévő értesítés cseréje: előbb összezárul
            card.classList.remove("dn-open", "dn-show");
            current = null;
            exitTimer = setTimeout(start, 280);
        } else {
            start();
        }
    }

    function dismiss() {
        if (!els || !current) return;
        clearTimers();
        var finished = current;
        current = null;
        els.card.style.transform = "";
        els.card.classList.remove("dn-open");
        exitTimer = setTimeout(function () {
            els.card.classList.remove("dn-show");
            if (typeof config.onDismiss === "function") config.onDismiss(finished);
        }, 380);
    }

    // ---- Kattintás és felfelé húzás ----
    function onPointerDown(e) {
        if (!current) return;
        drag = { y: e.clientY, dy: 0, moved: false };
        els.card.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
        if (!drag) return;
        var dy = Math.min(0, e.clientY - drag.y);
        if (Math.abs(e.clientY - drag.y) > 4) drag.moved = true;
        drag.dy = dy;
        els.card.classList.add("dn-drag");
        els.card.style.transform = "translateY(" + (34 + dy) + "px)";
    }

    function onPointerUp() {
        if (!drag) return;
        var d = drag;
        drag = null;
        els.card.classList.remove("dn-drag");
        if (d.dy < -24) {
            dismiss();
        } else if (!d.moved && current) {
            var n = current;
            dismiss();
            if (typeof n.onPress === "function") n.onPress();
        } else {
            els.card.style.transform = "";
        }
    }

    // ---- Szerver oldali értesítések (SSE) ----
    function connect(options) {
        options = options || {};
        if (options.apiUrl) config.apiUrl = options.apiUrl.replace(/\/$/, "");
        if (!options.token) {
            console.warn("DynamicNotifications.connect: token szükséges.");
            return;
        }
        disconnect();
        source = new EventSource(
            config.apiUrl + "/api/notifications/stream?token=" + encodeURIComponent(options.token)
        );
        source.addEventListener("notification", function (ev) {
            try {
                trigger(JSON.parse(ev.data));
            } catch (err) {
                console.error("Hibás értesítés:", err);
            }
        });
    }

    function disconnect() {
        if (source) {
            source.close();
            source = null;
        }
    }

    function configure(options) {
        for (var k in options) {
            if (Object.prototype.hasOwnProperty.call(options, k)) config[k] = options[k];
        }
    }

    global.DynamicNotifications = {
        trigger: trigger,
        dismiss: dismiss,
        connect: connect,
        disconnect: disconnect,
        configure: configure
    };
})(window);
