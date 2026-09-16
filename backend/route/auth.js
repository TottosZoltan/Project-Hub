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
// DATABASE TEST
// ======================================================


module.exports = router;
