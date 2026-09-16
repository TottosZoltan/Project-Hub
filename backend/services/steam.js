const crypto = require("crypto");
const { pool } = require("../database");
const { STEAM_API_KEY } = require("../config");

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
    getSteamImageUrls
};
