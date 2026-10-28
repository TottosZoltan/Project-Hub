const crypto = require("crypto");
const { pool } = require("../database");

function hashAuthToken(token) {

    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}


// ======================================================
// AUTH TOKEN LÉTREHOZÁSA
// ======================================================

async function createAuthToken(userId) {

    const token =
        crypto
            .randomBytes(48)
            .toString("hex");


    const tokenHash =
        hashAuthToken(token);


    const expiresAt =
        new Date(
            Date.now() +
            1000 *
            60 *
            60 *
            24 *
            30
        );


    await pool.query(
        `
        INSERT INTO auth_tokens (
            user_id,
            token_hash,
            expires_at
        )
        VALUES ($1, $2, $3)
        `,
        [
            userId,
            tokenHash,
            expiresAt
        ]
    );


    return token;
}


// ======================================================
// BEARER TOKEN KINYERÉSE
// ======================================================

function getBearerToken(req) {

    const authorization =
        req.headers.authorization;


    if (
        !authorization ||
        typeof authorization !== "string"
    ) {

        return null;

    }


    if (
        !authorization.startsWith(
            "Bearer "
        )
    ) {

        return null;

    }


    const token =
        authorization
            .substring(7)
            .trim();


    if (!token) {

        return null;

    }


    return token;
}


// ======================================================
// USER KERESÉSE TOKEN ALAPJÁN
// ======================================================

async function getUserFromAuthToken(token) {

    if (!token) {

        return null;

    }


    const tokenHash =
        hashAuthToken(token);


    const result =
        await pool.query(
            `
            SELECT
                u.id,
                u.username,
                u.email

            FROM auth_tokens t

            INNER JOIN users u
                ON u.id = t.user_id

            WHERE
                t.token_hash = $1

                AND t.expires_at >
                    CURRENT_TIMESTAMP

            LIMIT 1
            `,
            [
                tokenHash
            ]
        );


    if (
        result.rows.length === 0
    ) {

        return null;

    }


    return result.rows[0];
}


// ======================================================
// ÁLTALÁNOS AUTH
// ======================================================

async function getAuthenticatedUser(req) {

    const bearerToken =
        getBearerToken(req);

    if (bearerToken) {
        const tokenUser =
            await getUserFromAuthToken(bearerToken);

        if (tokenUser) {
            return tokenUser;
        }
    }

    if (req.session && req.session.userId) {
        const result =
            await pool.query(
                `
                SELECT
                    id,
                    username,
                    email

                FROM users

                WHERE id = $1

                LIMIT 1
                `,
                [req.session.userId]
            );

        if (result.rows.length > 0) {
            return result.rows[0];
        }
    }

    return null;
}

async function getAuthenticatedNotesUser(req) {

    const bearerToken =
        getBearerToken(req);


    if (!bearerToken) {

        return null;

    }


    const user =
        await getUserFromAuthToken(
            bearerToken
        );


    if (!user) {

        return null;

    }


    return user;
}


// ======================================================
// TASK AUTH
// ======================================================

async function getAuthenticatedTasksUser(req) {

    const bearerToken =
        getBearerToken(req);


    if (!bearerToken) {

        return null;

    }


    const user =
        await getUserFromAuthToken(
            bearerToken
        );


    if (!user) {

        return null;

    }


    return user;
}


// ======================================================
// STEAM AUTH
// ======================================================

async function getAuthenticatedSteamUser(req) {

    const bearerToken =
        getBearerToken(req);


    if (!bearerToken) {

        return null;

    }


    const user =
        await getUserFromAuthToken(
            bearerToken
        );


    if (!user) {

        return null;

    }


    return user;
}




// ======================================================
// OWNER TAG
// ======================================================

function createOwnerTag(userId) {
    return "USER-" + String(userId);
}

module.exports = {
    hashAuthToken,
    createAuthToken,
    getBearerToken,
    getUserFromAuthToken,
    getAuthenticatedUser,
    getAuthenticatedNotesUser,
    getAuthenticatedTasksUser,
    getAuthenticatedSteamUser,
    createOwnerTag
};
