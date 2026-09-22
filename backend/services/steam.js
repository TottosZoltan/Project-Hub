const crypto = require("crypto");
const { pool } = require("../database");
const { STEAM_API_KEY, STEAMGRIDDB_API_KEY } = require("../config");

// STEAM ACCOUNT
// ======================================================

async function getSteamAccountForUser(userId) {

    const result =
        await pool.query(
            `
            SELECT
                id,
                user_id,
                steam_id,
                steam_name,
                avatar,
                profile_url,
                created_at,
                updated_at

            FROM steam_accounts

            WHERE user_id = $1

            LIMIT 1
            `,
            [
                userId
            ]
        );


    return result.rows[0] || null;
}


// ======================================================
// STEAM LINK STATE
// ======================================================

function createSteamLinkState() {

    return crypto
        .randomBytes(32)
        .toString("hex");
}


function hashSteamLinkState(state) {

    return crypto
        .createHash("sha256")
        .update(state)
        .digest("hex");
}


// ======================================================
// STEAM PLAYER SUMMARY
// ======================================================

async function getSteamPlayerSummary(steamId) {

    if (!STEAM_API_KEY) {

        return null;

    }


    const url =
        "https://api.steampowered.com/" +
        "ISteamUser/GetPlayerSummaries/v0002/" +
        "?key=" +
        encodeURIComponent(
            STEAM_API_KEY
        ) +
        "&steamids=" +
        encodeURIComponent(
            steamId
        ) +
        "&format=json";


    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response;

    try {
        response = await fetch(url, {
            signal: controller.signal
        });
    }
    finally {
        clearTimeout(timeout);
    }


    if (!response.ok) {

        return null;

    }


    const data =
        await response.json();


    return (
        data?.response?.players?.[0] ||
        null
    );
}


// ======================================================
// STEAM API GET
// ======================================================

async function steamApiGet(
    interfaceName,
    methodName,
    version,
    params
) {

    if (!STEAM_API_KEY) {

        throw new Error(
            "A STEAM_API_KEY nincs beállítva."
        );

    }


    const query =
        new URLSearchParams();


    query.set(
        "key",
        STEAM_API_KEY
    );


    for (
        const [key, value]
        of Object.entries(
            params || {}
        )
    ) {

        if (
            value !== undefined &&
            value !== null
        ) {

            query.set(
                key,
                String(value)
            );

        }

    }


    query.set(
        "format",
        "json"
    );


    const url =
        "https://api.steampowered.com/" +
        encodeURIComponent(
            interfaceName
        ) +
        "/" +
        encodeURIComponent(
            methodName
        ) +
        "/" +
        encodeURIComponent(
            version
        ) +
        "/?" +
        query.toString();


    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response;

    try {
        response = await fetch(url, {
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeout);
    }


    if (!response.ok) {

        throw new Error(
            "Steam API HTTP hiba: " +
            response.status
        );

    }


    return await response.json();
}


// ======================================================
// STEAM KÉPEK
// ======================================================

function getSteamImageUrls(appId) {

    const id =
        String(appId);


    return {

        icon:
            "https://media.steampowered.com/steamcommunity/public/images/apps/" +
            id +
            "/icon.jpg",

        logo:
            "https://media.steampowered.com/steamcommunity/public/images/apps/" +
            id +
            "/logo.jpg",

        capsule:
            "https://cdn.cloudflare.steamstatic.com/steam/apps/" +
            id +
            "/header.jpg",

        background:
            "https://cdn.cloudflare.steamstatic.com/steam/apps/" +
            id +
            "/page_bg_generated_v6b.jpg"

    };
}


// ======================================================
// STEAMGRIDDB KÉP FALLBACK
// ======================================================

const steamGridImageCache = new Map();

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), ms)
        )
    ]);
}

/**
 * SteamGridDB artwork fallback.
 *
 * This is intentionally lazy: the frontend calls this endpoint only after
 * every normal Steam artwork candidate has failed. SteamGridDB v2 requires
 * an API key and is queried directly by Steam AppID, so no title matching
 * or scraping is necessary.
 *
 * The requested dimensions are SteamGridDB's horizontal artwork formats
 * (460x215 / 920x430). The frontend keeps the image inside its existing
 * 16:9 media frame so the card/detail layout remains consistent.
 */
async function getSteamGridImage(appId, gameName = "") {
    const id = String(appId || "").trim();
    const name = String(gameName || "").trim();

    if (!id && !name) return null;

    const cacheKey = id ? "steam:" + id : "name:" + name.toLowerCase();
    if (steamGridImageCache.has(cacheKey)) {
        return await steamGridImageCache.get(cacheKey);
    }

    const request = (async () => {
        if (!STEAMGRIDDB_API_KEY) {
            console.warn("SteamGridDB: STEAMGRIDDB_API_KEY nincs beállítva.");
            return null;
        }

        const headers = {
            Authorization: "Bearer " + STEAMGRIDDB_API_KEY,
            Accept: "application/json"
        };

        async function requestJson(url) {
            const response = await withTimeout(
                fetch(url, { headers }),
                8000
            );

            if (!response.ok) {
                console.warn("SteamGridDB HTTP hiba:", response.status, url);
                return null;
            }

            const payload = await response.json().catch(() => null);
            return payload && payload.success !== false ? payload : null;
        }

        function firstHorizontalImage(payload) {
            const values = Array.isArray(payload?.data) ? payload.data : [];
            const horizontal = values.filter(item =>
                item &&
                typeof item.url === "string" &&
                ["920x430", "460x215"].includes(String(item.dimensions || ""))
            );

            const preferred =
                horizontal.find(item => String(item.dimensions) === "920x430") ||
                horizontal.find(item => String(item.dimensions) === "460x215") ||
                values.find(item => typeof item?.url === "string");

            return typeof preferred?.url === "string" ? preferred.url : null;
        }

        try {
            // First try the Steam AppID directly. This is the most reliable
            // mapping and avoids title ambiguity.
            if (id) {
                const directUrl =
                    "https://www.steamgriddb.com/api/v2/grids/steam/" +
                    encodeURIComponent(id) +
                    "?dimensions=920x430,460x215&types=static";

                const directPayload = await requestJson(directUrl);
                const directImage = firstHorizontalImage(directPayload);
                if (directImage) return directImage;
            }

            // Some Steam titles are not mapped correctly by SGDB's Steam-ID
            // endpoint. Fall back to SGDB's title search, then query the
            // matching SGDB game ID.
            if (name) {
                const searchUrl =
                    "https://www.steamgriddb.com/api/v2/search/autocomplete/" +
                    encodeURIComponent(name);

                const searchPayload = await requestJson(searchUrl);
                const matches = Array.isArray(searchPayload?.data)
                    ? searchPayload.data
                    : [];

                const normalizedName = name.toLocaleLowerCase("hu-HU");
                const match =
                    matches.find(item =>
                        String(item?.name || "").trim().toLocaleLowerCase("hu-HU") === normalizedName
                    ) ||
                    matches.find(item =>
                        Array.isArray(item?.types) && item.types.includes("steam")
                    ) ||
                    matches[0];

                if (match?.id) {
                    const gameUrl =
                        "https://www.steamgriddb.com/api/v2/grids/game/" +
                        encodeURIComponent(match.id) +
                        "?dimensions=920x430,460x215&types=static";

                    const gamePayload = await requestJson(gameUrl);
                    const gameImage = firstHorizontalImage(gamePayload);
                    if (gameImage) return gameImage;
                }
            }
        } catch (error) {
            console.warn(
                "SteamGridDB artwork lookup failed:",
                error.message
            );
        }

        return null;
    })();

    steamGridImageCache.set(cacheKey, request);
    return await request;
}

// ======================================================
// OWNER TAG
// ======================================================

function createOwnerTag(userId) {

    return (
        "USER-" +
        String(userId)
    );
}


// ======================================================
// BASIC ROUTE
// ======================================================


module.exports = {
    getSteamAccountForUser,
    createSteamLinkState,
    hashSteamLinkState,
    getSteamPlayerSummary,
    steamApiGet,
    getSteamImageUrls,
    getSteamGridImage
};
