// =========================================
// PROJECT HUB — FEJLESZTŐI CONSOLE
// Verzió: 1.3.1
// =========================================

(function () {
    "use strict";

    const VERSION = "1.3.1";
    const STARTED_AT = performance.now();
    const original = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        group: console.group ? console.group.bind(console) : console.log.bind(console),
        groupEnd: console.groupEnd ? console.groupEnd.bind(console) : function () {}
    };

    function stamp() {
        return new Date().toLocaleTimeString("hu-HU", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    function prefix() {
        return `[Project Hub ${VERSION}] [${stamp()}]`;
    }

    function wrap(level) {
        const fn = original[level];
        console[level] = function () {
            fn(prefix(), ...arguments);
        };
    }

    wrap("log");
    wrap("info");
    wrap("warn");
    wrap("error");

    window.ProjectHubDebug = {
        version: VERSION,
        startedAt: new Date().toISOString(),
        log: (...args) => console.log(...args),
        info: (...args) => console.info(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args),
        group: (label) => original.group(`${prefix()} ${label}`),
        groupEnd: () => original.groupEnd()
    };

    original.group(`🚀 PROJECT HUB — fejlesztői konzol | v${VERSION}`);
    console.info(prefix(), "Build:", VERSION);
    console.info(prefix(), "Oldal:", window.location.pathname);
    console.info(prefix(), "URL:", window.location.href);
    console.info(prefix(), "Online:", navigator.onLine);
    console.info(prefix(), "Képernyő:", `${window.innerWidth}×${window.innerHeight}`);
    console.info(prefix(), "User Agent:", navigator.userAgent);
    original.groupEnd();

    // Oldalbetöltés / hálózati állapot
    window.addEventListener("load", function () {
        console.info(
            prefix(),
            `Oldal betöltve (${Math.round(performance.now() - STARTED_AT)} ms).`
        );
    });

    window.addEventListener("online", function () {
        console.info(prefix(), "🌐 Internetkapcsolat helyreállt.");
    });

    window.addEventListener("offline", function () {
        console.warn(prefix(), "⚠️ A böngésző offline állapotba került.");
    });

    // Kezeletlen JavaScript hibák
    window.addEventListener("error", function (event) {
        console.error(prefix(), "💥 Kezeletlen JavaScript hiba:", {
            message: event.message,
            file: event.filename,
            line: event.lineno,
            column: event.colno
        });
    });

    // Kezeletlen Promise hibák
    window.addEventListener("unhandledrejection", function (event) {
        console.error(prefix(), "💥 Kezeletlen Promise hiba:", event.reason);
    });

    // Fetch naplózás: URL, státusz és időtartam — érzékeny fejléceket nem naplóz.
    if (window.fetch) {
        const originalFetch = window.fetch.bind(window);

        window.fetch = async function () {
            const request = arguments[0];
            const started = performance.now();
            const url = typeof request === "string" ? request : request && request.url;
            const method = (arguments[1] && arguments[1].method) || (request && request.method) || "GET";

            try {
                const response = await originalFetch(...arguments);
                const duration = Math.round(performance.now() - started);

                if (response.ok) {
                    console.info(prefix(), `🌐 ${method} ${url} → ${response.status} (${duration} ms)`);
                } else {
                    console.warn(prefix(), `🌐 ${method} ${url} → ${response.status} (${duration} ms)`);
                }

                return response;
            } catch (error) {
                const duration = Math.round(performance.now() - started);
                console.error(prefix(), `🌐 ${method} ${url} → HÁLÓZATI HIBA (${duration} ms)`, error);
                throw error;
            }
        };
    }

    // Hasznos gyors parancsok a DevTools konzolban.
    window.phDebug = function () {
        console.table({
            version: VERSION,
            page: window.location.pathname,
            online: navigator.onLine,
            screen: `${window.innerWidth}×${window.innerHeight}`,
            localStorageToken: Boolean(localStorage.getItem("projectHubAuthToken")),
            userAgent: navigator.userAgent
        });
        console.info(prefix(), "Gyors diagnosztika kész.");
    };
})();
