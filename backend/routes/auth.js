const express = require("express");
const bcrypt = require("bcrypt");
const { pool } = require("../database");
const { createAuthToken, getAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

router.post(
    "/api/auth/register",
    async function (req, res) {

        try {

            const username =
                typeof req.body.username ===
                "string"
                    ? req.body.username.trim()
                    : "";


            const email =
                typeof req.body.email ===
                "string"
                    ? req.body.email
                        .trim()
                        .toLowerCase()
                    : "";


            const password =
                typeof req.body.password ===
                "string"
                    ? req.body.password
                    : "";


            if (
                !username ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A felhasználónév, e-mail és jelszó kötelező."

                });

            }


            if (
                username.length < 3
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A felhasználónév legalább 3 karakter legyen."

                });

            }


            if (
                password.length < 6
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A jelszó legalább 6 karakter legyen."

                });

            }


            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (
                !emailRegex.test(email)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Érvénytelen e-mail cím."

                });

            }


            const usernameCheck =
                await pool.query(
                    `
                    SELECT id
                    FROM users
                    WHERE LOWER(username) =
                          LOWER($1)
                    LIMIT 1
                    `,
                    [
                        username
                    ]
                );


            if (
                usernameCheck.rows.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Ez a felhasználónév már foglalt."

                });

            }


            const emailCheck =
                await pool.query(
                    `
                    SELECT id
                    FROM users
                    WHERE
                        email IS NOT NULL
                        AND LOWER(email) =
                            LOWER($1)
                    LIMIT 1
                    `,
                    [
                        email
                    ]
                );


            if (
                emailCheck.rows.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Ez az e-mail cím már használatban van."

                });

            }


            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );


            const result =
                await pool.query(
                    `
                    INSERT INTO users (
                        username,
                        email,
                        password_hash
                    )

                    VALUES (
                        $1,
                        $2,
                        $3
                    )

                    RETURNING
                        id,
                        username,
                        email,
                        created_at
                    `,
                    [
                        username,
                        email,
                        passwordHash
                    ]
                );


            const user =
                result.rows[0];


            req.session.userId =
                user.id;


            req.session.username =
                user.username;


            const token =
                await createAuthToken(
                    user.id
                );


            await new Promise(
                function (
                    resolve,
                    reject
                ) {

                    req.session.save(
                        function (error) {

                            if (error) {

                                reject(
                                    error
                                );

                            }
                            else {

                                resolve();

                            }

                        }
                    );

                }
            );


            return res.status(201).json({

                success: true,

                message:
                    "Sikeres regisztráció.",

                token: token,

                user: {

                    id:
                        user.id,

                    username:
                        user.username,

                    email:
                        user.email

                }

            });

        }
        catch (error) {

            console.error(
                "REGISZTRÁCIÓS HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Szerverhiba a regisztráció során."

            });

        }

    }
);


// ======================================================
// LOGIN
// ======================================================

router.post(
    "/api/auth/login",
    async function (req, res) {

        try {

            const login =
                typeof req.body.login ===
                "string"
                    ? req.body.login.trim()
                    : "";


            const password =
                typeof req.body.password ===
                "string"
                    ? req.body.password
                    : "";


            if (
                !login ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Az e-mail/felhasználónév és a jelszó kötelező."

                });

            }


            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        username,
                        email,
                        password_hash

                    FROM users

                    WHERE
                        LOWER(username) =
                        LOWER($1)

                        OR (
                            email IS NOT NULL
                            AND LOWER(email) =
                                LOWER($1)
                        )

                    LIMIT 1
                    `,
                    [
                        login
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Hibás e-mail/felhasználónév vagy jelszó."

                });

            }


            const user =
                result.rows[0];


            if (
                !user.password_hash
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Ehhez a fiókhoz nincs érvényes jelszó beállítva."

                });

            }


            const passwordValid =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );


            if (
                !passwordValid
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Hibás e-mail/felhasználónév vagy jelszó."

                });

            }


            req.session.userId =
                user.id;


            req.session.username =
                user.username;


            const token =
                await createAuthToken(
                    user.id
                );


            await new Promise(
                function (
                    resolve,
                    reject
                ) {

                    req.session.save(
                        function (error) {

                            if (error) {

                                reject(
                                    error
                                );

                            }
                            else {

                                resolve();

                            }

                        }
                    );

                }
            );


            return res.json({

                success: true,

                message:
                    "Sikeres bejelentkezés.",

                token: token,

                user: {

                    id:
                        user.id,

                    username:
                        user.username,

                    email:
                        user.email

                }

            });

        }
        catch (error) {

            console.error(
                "BEJELENTKEZÉSI HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Szerverhiba a bejelentkezés során."

            });

        }

    }
);
router.get(
    "/api/auth/me",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Nincs bejelentkezett felhasználó."

                });

            }


            return res.json({

                success: true,

                user: {

                    id:
                        user.id,

                    username:
                        user.username,

                    email:
                        user.email

                }

            });

        }
        catch (error) {

            console.error(
                "AUTH ME HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Szerverhiba."

            });

        }

    }
);


// ======================================================
// LOGOUT
// ======================================================

router.post(
    "/api/auth/logout",
    async function (req, res) {

        try {

            const bearerToken =
                getBearerToken(req);


            if (bearerToken) {

                const tokenHash =
                    hashAuthToken(
                        bearerToken
                    );


                await pool.query(
                    `
                    DELETE FROM auth_tokens
                    WHERE token_hash = $1
                    `,
                    [
                        tokenHash
                    ]
                );

            }


            if (req.session) {

                await new Promise(
                    function (
                        resolve,
                        reject
                    ) {

                        req.session.destroy(
                            function (error) {

                                if (error) {

                                    reject(
                                        error
                                    );

                                }
                                else {

                                    resolve();

                                }

                            }
                        );

                    }
                );

            }


            res.clearCookie(
                "connect.sid",
                {
                    path: "/"
                }
            );


            return res.json({

                success: true,

                message:
                    "Sikeres kijelentkezés."

            });

        }
        catch (error) {

            console.error(
                "KIJELENTKEZÉSI HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Szerverhiba a kijelentkezés során."

            });

        }

    }
);



// ======================================================
// PROJECT HUB PROFILE
// ======================================================

router.get(
    "/api/profile",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedUser(req);


            if (!user) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Érvényes bejelentkezés szükséges."
                });

            }


            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        username,
                        email,
                        profile_image
                    FROM users
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [user.id]
                );


            if (result.rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "A profil nem található."
                });

            }


            const profile = result.rows[0];


            return res.json({
                success: true,
                profile: {
                    id: profile.id,
                    username: profile.username,
                    email: profile.email,
                    profileImage: profile.profile_image || null
                }
            });

        }
        catch (error) {

            console.error(
                "PROFILE GET HIBA:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Nem sikerült betölteni a profilt."
            });

        }

    }
);


// ======================================================
// PROJECT HUB PROFILE - AVATAR FELTÖLTÉS
// ======================================================

router.post(
    "/api/profile/avatar",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedUser(req);


            if (!user) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Érvényes bejelentkezés szükséges."
                });

            }


            const image =
                typeof req.body.image === "string"
                    ? req.body.image.trim()
                    : "";


            if (!image) {

                return res.status(400).json({
                    success: false,
                    error:
                        "A profilkép hiányzik."
                });

            }


            // A frontend JPEG data URL-t küld a képfeldolgozás után.
            const imagePattern =
                /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\r\n]+$/i;


            if (!imagePattern.test(image)) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Érvénytelen profilkép formátum."
                });

            }


            // A képadatot kb. 1.5 MB alatt tartjuk, hogy a profilkép
            // ne terhelje túl az API-t és az adatbázist.
            if (Buffer.byteLength(image, "utf8") > 1.5 * 1024 * 1024) {

                return res.status(413).json({
                    success: false,
                    error:
                        "A profilkép túl nagy. Válassz kisebb képet."
                });

            }


            await pool.query(
                `
                UPDATE users
                SET
                    profile_image = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                `,
                [
                    image,
                    user.id
                ]
            );


            return res.json({
                success: true,
                profileImage: image,
                message:
                    "A profilkép sikeresen mentve."
            });

        }
        catch (error) {

            console.error(
                "PROFILE AVATAR POST HIBA:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Nem sikerült elmenteni a profilképet."
            });

        }

    }
);


// ======================================================
// PROJECT HUB PROFILE - AVATAR TÖRLÉS
// ======================================================

router.delete(
    "/api/profile/avatar",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedUser(req);


            if (!user) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Érvényes bejelentkezés szükséges."
                });

            }


            await pool.query(
                `
                UPDATE users
                SET
                    profile_image = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                `,
                [
                    user.id
                ]
            );


            return res.json({
                success: true,
                profileImage: null,
                message:
                    "A profilkép törölve."
            });

        }
        catch (error) {

            console.error(
                "PROFILE AVATAR DELETE HIBA:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Nem sikerült törölni a profilképet."
            });

        }

    }
);


// ======================================================
// DATABASE TEST
// ======================================================


module.exports = router;
