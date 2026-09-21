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


    const response =
        await fetch(url);


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


    const response =
        await fetch(url);


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
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
    ]);
}

function extractGridUrl(payload) {
    const values = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.grids)
                ? payload.grids
                : [];
    const preferred = values.find(item =>
        item && typeof item.url === "string" &&
        (!item.dimensions || item.dimensions === "460x215" || item.dimensions === "920x430")
    );
    return preferred?.url || values.find(item => typeof item?.url === "string")?.url || null;
}

/**
 * Looks up a 16:9 SteamGridDB artwork only after normal Steam artwork fails.
 * v2 is preferred when STEAMGRIDDB_API_KEY is configured; the deprecated
 * public v1 endpoint is retained as a compatibility fallback.
 */
async function getSteamGridImage(appId, gameName = "") {
    const id = String(appId || "");
    if (!id) return null;
    if (steamGridImageCache.has(id)) return await steamGridImageCache.get(id);

    const request = (async () => {
        try {
            if (STEAMGRIDDB_API_KEY) {
                const response = await withTimeout(
                    fetch(
                        "https://www.steamgriddb.com/api/v2/grids/steam/" +
                        encodeURIComponent(id) +
                        "?dimensions=460x215,920x430",
                        {
                            headers: {
                                Authorization: "Bearer " + STEAMGRIDDB_API_KEY,
                                Accept: "application/json"
                            }
                        }
                    ),
                    5000
                );
                if (response.ok) {
                    const url = extractGridUrl(await response.json());
                    if (url) return url;
                }
            }

            if (gameName) {
                const response = await withTimeout(
                    fetch(
                        "https://www.steamgriddb.com/api/grids?" +
                        new URLSearchParams({
                            game: gameName,
                            fields: "grid_url,grid_url_thumbnail,style",
                            orderby: "score",
                            orderdirection: "desc"
                        }).toString(),
                        { headers: { Accept: "application/json" } }
                    ),
                    5000
                );
                if (response.ok) {
                    const payload = await response.json();
                    const legacy = Array.isArray(payload) ? payload : payload?.grids || payload?.data || [];
                    return legacy.find(item => typeof item?.grid_url === "string")?.grid_url ||
                        legacy.find(item => typeof item?.grid_url_thumbnail === "string")?.grid_url_thumbnail ||
                        null;
                }
            }
        } catch (error) {
            console.warn("SteamGridDB artwork lookup failed:", error.message);
        }
        return null;
    })();

    steamGridImageCache.set(id, request);
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
