const express = require("express");
const { pool } = require("../database");
const { FRONTEND_URL, PROJECT_HUB_URL, BACKEND_URL, STEAM_API_KEY, STEAMGRIDDB_API_KEY } = require("../config");
const { getAuthenticatedSteamUser } = require("../middleware/auth");
const {
    getSteamAccountForUser,
    createSteamLinkState,
    hashSteamLinkState,
    getSteamPlayerSummary,
    steamApiGet,
    getSteamImageUrls,
    getSteamGridImage
} = require("../services/steam");
const router = require("express").Router();

function steamProfileRedirect(status, reason) {
    const params = new URLSearchParams();
    params.set("steam_link", status);
    if (reason) params.set("reason", reason);
    const base = (PROJECT_HUB_URL || `${FRONTEND_URL}/Project-Hub`).replace(/\/$/, "");
    return base + "/pages/profile/profile.html?" + params.toString();
}

router.get(
    "/api/steam/link",
    async function (req, res) {

        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");

        try {

            const user =
                await getAuthenticatedSteamUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            // A Steam OpenID kapcsolat elindításához önmagában
            // nincs szükség Steam Web API kulcsra. A kulcs csak a
            // profil/játékkönyvtár adatok lekéréséhez szükséges.

            // --------------------------------------------------
            // Biztonsági state létrehozása
            // --------------------------------------------------

            const state =
                createSteamLinkState();


            const stateHash =
                hashSteamLinkState(
                    state
                );


            const expiresAt =
                new Date(
                    Date.now() +
                    1000 *
                    60 *
                    10
                );


            // --------------------------------------------------
            // Korábbi state törlése
            // --------------------------------------------------

            await pool.query(
                `
                DELETE FROM steam_link_states

                WHERE user_id = $1
                `,
                [
                    user.id
                ]
            );


            // --------------------------------------------------
            // Új state mentése
            // --------------------------------------------------

            await pool.query(
                `
                INSERT INTO steam_link_states (
                    user_id,
                    state_hash,
                    expires_at
                )

                VALUES (
                    $1,
                    $2,
                    $3
                )
                `,
                [
                    user.id,
                    stateHash,
                    expiresAt
                ]
            );


            // --------------------------------------------------
            // Steam OpenID callback URL
            // --------------------------------------------------

            const returnTo =
                new URL("/api/steam/callback", BACKEND_URL).toString();


            // --------------------------------------------------
            // Steam OpenID URL
            // --------------------------------------------------

            const steamOpenIdUrl =
                "https://steamcommunity.com/openid/login?" +
                new URLSearchParams({

                    "openid.ns":
                        "http://specs.openid.net/auth/2.0",

                    "openid.mode":
                        "checkid_setup",

                    "openid.return_to":
                        returnTo +
                        "?state=" +
                        encodeURIComponent(
                            state
                        ),

                    "openid.realm":
                        BACKEND_URL + "/",

                    "openid.identity":
                        "http://specs.openid.net/auth/2.0/identifier_select",

                    "openid.claimed_id":
                        "http://specs.openid.net/auth/2.0/identifier_select"

                }).toString();


            // --------------------------------------------------
            // URL visszaadása a frontendnek
            // --------------------------------------------------

            return res.json({

                success: true,

                url:
                    steamOpenIdUrl

            });

        }
        catch (error) {

            console.error(
                "STEAM LINK INDÍTÁSI HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült elindítani a Steam összekapcsolását."

            });

        }

    }
);


// ======================================================
// STEAM LINK - CALLBACK
// ======================================================
//
// Steam OpenID után ide érkezünk vissza.
// A state alapján azonosítjuk a Project Hub usert.
// ======================================================

router.get(
    "/api/steam/callback",
    async function (req, res) {

        try {

            // --------------------------------------------------
            // 1. State kiolvasása
            // --------------------------------------------------

            const state =
                typeof req.query.state === "string"
                    ? req.query.state
                    : "";


            if (!state) {

                return res.redirect(
                    steamProfileRedirect("error", "missing_state")
                );

            }


            // --------------------------------------------------
            // 2. State hash
            // --------------------------------------------------

            const stateHash =
                hashSteamLinkState(
                    state
                );


            // --------------------------------------------------
            // 3. State megkeresése
            // --------------------------------------------------

            const stateResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        user_id,
                        state_hash,
                        expires_at

                    FROM steam_link_states

                    WHERE
                        state_hash = $1

                        AND expires_at >
                            CURRENT_TIMESTAMP

                    LIMIT 1
                    `,
                    [
                        stateHash
                    ]
                );


            if (
                stateResult.rows.length === 0
            ) {

                return res.redirect(
                    steamProfileRedirect("error", "invalid_state")
                );

            }


            const linkState =
                stateResult.rows[0];


            const userId =
                linkState.user_id;


            // --------------------------------------------------
            // 4. Steam OpenID mód ellenőrzése
            // --------------------------------------------------

            if (
                req.query["openid.mode"] !==
                "id_res"
            ) {

                await pool.query(
                    `
                    DELETE FROM steam_link_states

                    WHERE id = $1
                    `,
                    [
                        linkState.id
                    ]
                );


                return res.redirect(
                    steamProfileRedirect("error", "openid_failed")
                );

            }


            // --------------------------------------------------
            // 5. Steam claimed ID
            // --------------------------------------------------

            const claimedId =
                typeof req.query[
                    "openid.claimed_id"
                ] === "string"
                    ? req.query[
                        "openid.claimed_id"
                    ]
                    : "";


            if (!claimedId) {

                await pool.query(
                    `
                    DELETE FROM steam_link_states

                    WHERE id = $1
                    `,
                    [
                        linkState.id
                    ]
                );


                return res.redirect(
                    steamProfileRedirect("error", "missing_steam_id")
                );

            }


            // --------------------------------------------------
            // 6. Steam OpenID válasz összegyűjtése
            // --------------------------------------------------

            const verifyParams =
                new URLSearchParams();


            for (
                const [key, value]
                of Object.entries(
                    req.query
                )
            ) {

                if (
                    key.startsWith(
                        "openid."
                    )
                ) {

                    const cleanValue =
                        Array.isArray(value)
                            ? value[0]
                            : value;


                    if (
                        cleanValue !==
                        undefined &&
                        cleanValue !==
                        null
                    ) {

                        verifyParams.set(
                            key,
                            String(
                                cleanValue
                            )
                        );

                    }

                }

            }


            // Steam szervernek ezt kell küldenünk
            verifyParams.set(
                "openid.mode",
                "check_authentication"
            );


            // --------------------------------------------------
            // 7. Steam OpenID ellenőrzése
            // --------------------------------------------------

            const verifyResponse =
                await fetch(
                    "https://steamcommunity.com/openid/login",
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/x-www-form-urlencoded"

                        },

                        body:
                            verifyParams.toString()

                    }
                );


            if (
                !verifyResponse.ok
            ) {

                await pool.query(
                    `
                    DELETE FROM steam_link_states

                    WHERE id = $1
                    `,
                    [
                        linkState.id
                    ]
                );


                return res.redirect(
                    steamProfileRedirect("error", "steam_verify_failed")
                );

            }


            const verifyText =
                await verifyResponse.text();


            if (
                !/is_valid\s*:\s*true/i.test(
                    verifyText
                )
            ) {

                await pool.query(
                    `
                    DELETE FROM steam_link_states

                    WHERE id = $1
                    `,
                    [
                        linkState.id
                    ]
                );


                return res.redirect(
                    steamProfileRedirect("error", "invalid_steam_login")
                );

            }


            // --------------------------------------------------
            // 8. SteamID64 kinyerése
            // --------------------------------------------------

            const steamIdMatch =
                claimedId.match(
                    /^https:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/
                );


            if (
                !steamIdMatch
            ) {

                await pool.query(
                    `
                    DELETE FROM steam_link_states

                    WHERE id = $1
                    `,
                    [
                        linkState.id
                    ]
                );


                return res.redirect(
                    steamProfileRedirect("error", "invalid_steam_id")
                );

            }


            const steamId =
                steamIdMatch[1];


            // --------------------------------------------------
            // 9. Ellenőrizzük, hogy nincs-e más userhez kötve
            // --------------------------------------------------

            const existingSteamAccount =
                await pool.query(
                    `
                    SELECT
                        user_id

                    FROM steam_accounts

                    WHERE
                        steam_id = $1

                        AND user_id <> $2

                    LIMIT 1
                    `,
                    [
                        steamId,
                        userId
                    ]
                );


            if (
                existingSteamAccount.rows.length >
                0
            ) {

                await pool.query(
                    `
                    DELETE FROM steam_link_states

                    WHERE id = $1
                    `,
                    [
                        linkState.id
                    ]
                );


                return res.redirect(
                    steamProfileRedirect("error", "steam_already_linked")
                );

            }


            // --------------------------------------------------
            // 10. Steam profil lekérése
            // --------------------------------------------------

            let steamProfile =
                null;


            try {

                steamProfile =
                    await getSteamPlayerSummary(
                        steamId
                    );

            }
            catch (
                profileError
            ) {

                console.error(
                    "STEAM PROFIL LEKÉRÉSI HIBA:",
                    profileError
                );

            }


            // --------------------------------------------------
            // 11. Steam profil adatok
            // --------------------------------------------------

            const steamName =
                steamProfile?.personaname ||
                null;


            const avatar =
                steamProfile?.avatarfull ||
                steamProfile?.avatarmedium ||
                steamProfile?.avatar ||
                null;


            const profileUrl =
                steamProfile?.profileurl ||
                (
                    "https://steamcommunity.com/profiles/" +
                    steamId
                );


            // --------------------------------------------------
            // 12. Steam account mentése
            // --------------------------------------------------

            await pool.query(
                `
                INSERT INTO steam_accounts (
                    user_id,
                    steam_id,
                    steam_name,
                    avatar,
                    profile_url,
                    created_at,
                    updated_at
                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )

                ON CONFLICT (user_id)

                DO UPDATE SET

                    steam_id =
                        EXCLUDED.steam_id,

                    steam_name =
                        EXCLUDED.steam_name,

                    avatar =
                        EXCLUDED.avatar,

                    profile_url =
                        EXCLUDED.profile_url,

                    updated_at =
                        CURRENT_TIMESTAMP
                `,
                [
                    userId,
                    steamId,
                    steamName,
                    avatar,
                    profileUrl
                ]
            );


            // --------------------------------------------------
            // 13. State törlése
            // --------------------------------------------------

            await pool.query(
                `
                DELETE FROM steam_link_states

                WHERE id = $1
                `,
                [
                    linkState.id
                ]
            );


            // --------------------------------------------------
            // 14. Vissza a Project Hub frontendhez
            // --------------------------------------------------

            return res.redirect(
                steamProfileRedirect("success")
            );

        }
        catch (error) {

            console.error(
                "STEAM CALLBACK HIBA:",
                error
            );


            return res.redirect(
                steamProfileRedirect("error", "server_error")
            );

        }

    }
);


// ======================================================
// STEAM ACCOUNT - INFO
// ======================================================

router.get(
    "/api/steam/account",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedSteamUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            const account =
                await getSteamAccountForUser(
                    user.id
                );


            if (!account) {

                return res.json({

                    success: true,

                    connected: false,

                    account: null

                });

            }


            return res.json({

                success: true,

                connected: true,

                account: account

            });

        }
        catch (error) {

            console.error(
                "STEAM ACCOUNT HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült lekérni a Steam kapcsolatot."

            });

        }

    }
);


// ======================================================
// STEAM ACCOUNT - LEVÁLASZTÁS
// ======================================================

router.delete(
    "/api/steam/account",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedSteamUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            await pool.query(
                `
                DELETE FROM steam_accounts

                WHERE user_id = $1
                `,
                [
                    user.id
                ]
            );


            return res.json({

                success: true,

                connected: false,

                message:
                    "A Steam-fiók leválasztva."

            });

        }
        catch (error) {

            console.error(
                "STEAM ACCOUNT DELETE HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült leválasztani a Steam-fiókot."

            });

        }

    }
);


// ======================================================
// STEAM GAMES
// ======================================================

router.get(
    "/api/steam/games",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedSteamUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            if (!STEAM_API_KEY) {

                return res.status(500).json({

                    success: false,

                    message:
                        "A STEAM_API_KEY nincs beállítva."

                });

            }


            const account =
                await getSteamAccountForUser(
                    user.id
                );


            if (!account) {

                return res.json({

                    success: true,

                    connected: false,

                    gameCount: 0,

                    games: []

                });

            }


            const data =
                await steamApiGet(
                    "IPlayerService",
                    "GetOwnedGames",
                    "v0001",
                    {

                        steamid:
                            account.steam_id,

                        include_appinfo:
                            1,

                        include_played_free_games:
                            1

                    }
                );


            const games =
                data?.response?.games ||
                [];


            games.sort(
                function (a, b) {

                    return (
                        (b.playtime_forever || 0) -
                        (a.playtime_forever || 0)
                    );

                }
            );


            const formattedGames =
                await Promise.all(
                    games.map(
                        async function (game) {

                            const images =
                                getSteamImageUrls(
                                    game.appid
                                );

                            // A SteamGridDB képet csak a frontend fallback
                            // endpointja használja, ezért a normál lista
                            // betöltése nem lassul minden játéknál.
                            images.grid = null;


                        return {

                            appid:
                                game.appid,

                            name:
                                game.name ||
                                "Ismeretlen játék",

                            playtimeForever:
                                game.playtime_forever ||
                                0,

                            playtimeForeverHours:
                                Math.round(
                                    (
                                        game.playtime_forever ||
                                        0
                                    ) /
                                    60 *
                                    10
                                ) / 10,

                            playtime2Weeks:
                                game.playtime_2weeks ||
                                0,

                            playtime2WeeksHours:
                                Math.round(
                                    (
                                        game.playtime_2weeks ||
                                        0
                                    ) /
                                    60 *
                                    10
                                ) / 10,

                            imgIconUrl:
                                game.img_icon_url ||
                                null,

                            imgLogoUrl:
                                game.img_logo_url ||
                                null,

                            images:
                                images

                        };

                        }
                    )
                );


            return res.json({

                success: true,

                connected: true,

                steamId:
                    account.steam_id,

                steamName:
                    account.steam_name,

                gameCount:
                    formattedGames.length,

                games:
                    formattedGames

            });

        }
        catch (error) {

            console.error(
                "STEAM GAMES HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült lekérni a Steam játékokat."

            });

        }

    }
);


// ======================================================
// STEAMGRIDDB IMAGE FALLBACK
// ======================================================
// Only called by the frontend after the normal Steam artwork
// candidates have failed. This keeps the normal library fast.
// ======================================================

router.get(
    "/api/steam/grid-image/:appid",
    async function (req, res) {
        try {
            const user = await getAuthenticatedSteamUser(req);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Érvényes bejelentkezés szükséges."
                });
            }

            const appId = Number(req.params.appid);

            if (!Number.isInteger(appId) || appId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Érvénytelen Steam AppID."
                });
            }

            const account = await getSteamAccountForUser(user.id);

            if (!account) {
                return res.status(400).json({
                    success: false,
                    connected: false,
                    message: "Nincs Steam-fiók összekötve."
                });
            }

            if (!STEAMGRIDDB_API_KEY) {
                return res.status(503).json({
                    success: false,
                    image: null,
                    source: null,
                    message: "A STEAMGRIDDB_API_KEY nincs beállítva."
                });
            }

            // A lookup csak a saját Steam könyvtárban lévő AppID-kre engedélyezett.
            const ownedGamesData = await steamApiGet(
                "IPlayerService",
                "GetOwnedGames",
                "v0001",
                {
                    steamid: account.steam_id,
                    include_appinfo: 1,
                    include_played_free_games: 1
                }
            );

            const ownedGame = (
                ownedGamesData?.response?.games || []
            ).find(item => Number(item.appid) === appId);

            if (!ownedGame) {
                return res.status(404).json({
                    success: false,
                    message: "A játék nem található a Steam könyvtáradban."
                });
            }

            const image = await getSteamGridImage(appId);

            return res.json({
                success: true,
                image: image || null,
                source: image ? "steamgriddb" : null
            });
        } catch (error) {
            console.error("STEAMGRIDDB IMAGE HIBA:", error);

            return res.status(502).json({
                success: false,
                image: null,
                message: "Nem sikerült SteamGridDB képet lekérni."
            });
        }
    }
);


// ======================================================
// STEAM GAME DETAILS + ACHIEVEMENTS
// ======================================================

router.get(
    "/api/steam/game/:appid",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedSteamUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            if (!STEAM_API_KEY) {

                return res.status(500).json({

                    success: false,

                    message:
                        "A STEAM_API_KEY nincs beállítva."

                });

            }


            const appId =
                Number(
                    req.params.appid
                );


            if (
                !Number.isInteger(appId) ||
                appId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Érvénytelen Steam AppID."

                });

            }


            const account =
                await getSteamAccountForUser(
                    user.id
                );


            if (!account) {

                return res.status(400).json({

                    success: false,

                    connected: false,

                    message:
                        "Nincs Steam-fiók összekötve."

                });

            }


            // --------------------------------------------------
            // Játék ellenőrzése a saját Steam könyvtárban
            // --------------------------------------------------

            const ownedGamesData =
                await steamApiGet(
                    "IPlayerService",
                    "GetOwnedGames",
                    "v0001",
                    {

                        steamid:
                            account.steam_id,

                        include_appinfo:
                            1,

                        include_played_free_games:
                            1

                    }
                );


            const games =
                ownedGamesData
                    ?.response
                    ?.games ||
                [];


            const game =
                games.find(
                    function (item) {

                        return (
                            Number(
                                item.appid
                            ) === appId
                        );

                    }
                );


            if (!game) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Ez a játék nem található a Steam könyvtáradban."

                });

            }


            const images =
                getSteamImageUrls(
                    appId
                );

            // A részletes nézet is megkapja az SGDB fallbacket, de csak
            // akkor kérdezzük le, ha a normál Steam kép később hibásnak bizonyul.
            images.grid = null;


            // --------------------------------------------------
            // Steam Store adatok (az „Egyéb infók” fülhöz)
            // --------------------------------------------------
            let store = {
                developers: [],
                publishers: [],
                releaseDate: "",
                genres: [],
                storeUrl: `https://store.steampowered.com/app/${appId}/`
            };

            try {
                const storeResponse = await fetch(
                    `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appId)}&l=hungarian`
                );
                if (storeResponse.ok) {
                    const storeData = await storeResponse.json();
                    const app = storeData?.[String(appId)]?.data;
                    if (app) {
                        store = {
                            developers: Array.isArray(app.developers) ? app.developers : [],
                            publishers: Array.isArray(app.publishers) ? app.publishers : [],
                            releaseDate: app.release_date?.date || "",
                            genres: Array.isArray(app.genres) ? app.genres.map(item => item.description).filter(Boolean) : [],
                            storeUrl: `https://store.steampowered.com/app/${appId}/`
                        };
                    }
                }
            } catch (storeError) {
                console.warn("STEAM STORE ADATOK HIBA:", storeError.message);
            }


            // --------------------------------------------------
            // Achievementek
            // --------------------------------------------------

            let achievements = [];


            let achievementStats = {

                unlocked:
                    0,

                total:
                    0,

                percentage:
                    0

            };


            try {

                const achievementData =
                    await steamApiGet(
                        "ISteamUserStats",
                        "GetPlayerAchievements",
                        "v0001",
                        {

                            steamid:
                                account.steam_id,

                            appid:
                                appId,

                            l:
                                "english"

                        }
                    );


                const rawAchievements =
                    achievementData
                        ?.playerstats
                        ?.achievements ||
                    [];


                achievements =
                    rawAchievements.map(
                        function (
                            achievement
                        ) {

                            return {

                                apiname:
                                    achievement.apiname,

                                name:
                                    achievement.name ||
                                    achievement.apiname,

                                description:
                                    achievement.description ||
                                    "",

                                icon:
                                    achievement.icon ||
                                    "",

                                icongray:
                                    achievement.icongray ||
                                    "",

                                achieved:
                                    achievement.achieved === 1,

                                unlocktime:
                                    achievement.unlocktime ||
                                    0

                            };

                        }
                    );


                achievementStats.total =
                    achievements.length;


                achievementStats.unlocked =
                    achievements.filter(
                        function (
                            achievement
                        ) {

                            return achievement.achieved;

                        }
                    ).length;


                if (
                    achievementStats.total >
                    0
                ) {

                    achievementStats.percentage =
                        Math.round(
                            (
                                achievementStats.unlocked /
                                achievementStats.total
                            ) *
                            100
                        );

                }

            }
            catch (
                achievementError
            ) {

                console.error(
                    "STEAM ACHIEVEMENT HIBA:",
                    achievementError
                );

            }


            return res.json({

                success: true,

                connected: true,

                game: {

                    appid:
                        game.appid,

                    name:
                        game.name,

                    playtimeForever:
                        game.playtime_forever ||
                        0,

                    playtimeForeverHours:
                        Math.round(
                            (
                                game.playtime_forever ||
                                0
                            ) /
                            60 *
                            10
                        ) / 10,

                    playtime2Weeks:
                        game.playtime_2weeks ||
                        0,

                    playtime2WeeksHours:
                        Math.round(
                            (
                                game.playtime_2weeks ||
                                0
                            ) /
                            60 *
                            10
                        ) / 10,

                    images:
                        images

                },

                store:
                    store,

                achievements:
                    achievements,

                achievementStats:
                    achievementStats

            });

        }
        catch (error) {

            console.error(
                "STEAM GAME DETAILS HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült lekérni a játék adatait."

            });

        }

    }
);


// ======================================================
// STEAM PROFILE
// ======================================================

router.get(
    "/api/steam/profile",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedSteamUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            const account =
                await getSteamAccountForUser(
                    user.id
                );


            if (!account) {

                return res.json({

                    success: true,

                    connected: false,

                    profile: null

                });

            }


            const data =
                await steamApiGet(
                    "ISteamUser",
                    "GetPlayerSummaries",
                    "v0002",
                    {

                        steamids:
                            account.steam_id

                    }
                );


            const profile =
                data
                    ?.response
                    ?.players
                    ?.[0] ||
                null;


            if (!profile) {

                return res.status(404).json({

                    success: false,

                    message:
                        "A Steam profil nem található."

                });

            }


            return res.json({

                success: true,

                connected: true,

                profile: {

                    steamId:
                        profile.steamid,

                    name:
                        profile.personaname,

                    profileUrl:
                        profile.profileurl,

                    avatar:
                        profile.avatarfull ||
                        profile.avatarmedium ||
                        profile.avatar,

                    personaState:
                        profile.personastate,

                    gameName:
                        profile.gameextrainfo ||
                        null,

                    gameId:
                        profile.gameid ||
                        null,

                    created:
                        profile.timecreated ||
                        null

                }

            });

        }
        catch (error) {

            console.error(
                "STEAM PROFILE HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült lekérni a Steam profilt."

            });

        }

    }
);


// ======================================================
// STEAM RECENT GAMES
// ======================================================

router.get(
    "/api/steam/recent",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedSteamUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            const account =
                await getSteamAccountForUser(
                    user.id
                );


            if (!account) {

                return res.json({

                    success: true,

                    connected: false,

                    games: []

                });

            }


            const data =
                await steamApiGet(
                    "IPlayerService",
                    "GetRecentlyPlayedGames",
                    "v0001",
                    {

                        steamid:
                            account.steam_id

                    }
                );


            const games =
                data
                    ?.response
                    ?.games ||
                [];


            const formattedGames =
                games.map(
                    function (game) {

                        return {

                            appid:
                                game.appid,

                            name:
                                game.name,

                            playtime2Weeks:
                                game.playtime_2weeks ||
                                0,

                            playtime2WeeksHours:
                                Math.round(
                                    (
                                        game.playtime_2weeks ||
                                        0
                                    ) /
                                    60 *
                                    10
                                ) / 10,

                            playtimeForever:
                                game.playtime_forever ||
                                0,

                            images:
                                getSteamImageUrls(
                                    game.appid
                                )

                        };

                    }
                );


            return res.json({

                success: true,

                connected: true,

                games:
                    formattedGames

            });

        }
        catch (error) {

            console.error(
                "STEAM RECENT HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült lekérni a legutóbb játszott játékokat."

            });

        }

    }
);

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================


module.exports = router;
