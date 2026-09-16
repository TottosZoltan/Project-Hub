const express = require("express");
const { pool } = require("../database");
const { getAuthenticatedNotesUser, createOwnerTag } = require("../middleware/auth");
const router = require("express").Router();

router.get(
    "/api/notes",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedNotesUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges a jegyzetekhez."

                });

            }


            const ownerTag =
                createOwnerTag(
                    user.id
                );


            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        user_id,
                        owner_tag,
                        title,
                        content,
                        category,
                        pinned,
                        created_at,
                        updated_at

                    FROM notes

                    WHERE
                        user_id = $1
                        AND owner_tag = $2

                    ORDER BY
                        pinned DESC,
                        updated_at DESC
                    `,
                    [
                        user.id,
                        ownerTag
                    ]
                );


            return res.json({

                success: true,

                user: {

                    id:
                        user.id,

                    username:
                        user.username

                },

                notes:
                    result.rows

            });

        }
        catch (error) {

            console.error(
                "NOTES GET HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült betölteni a jegyzeteket."

            });

        }

    }
);


// ======================================================
// NOTES - CREATE
// ======================================================

router.post(
    "/api/notes",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedNotesUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges a jegyzethez."

                });

            }


            const ownerUserId =
                user.id;


            const ownerTag =
                createOwnerTag(
                    ownerUserId
                );


            const title =
                typeof req.body.title ===
                "string"
                    ? req.body.title.trim()
                    : "";


            const content =
                typeof req.body.content ===
                "string"
                    ? req.body.content
                    : (
                        typeof req.body.text ===
                        "string"
                            ? req.body.text
                            : ""
                    );


            const category =
                typeof req.body.category ===
                "string"
                    ? req.body.category.trim()
                    : "Egyéb";


            const pinned =
                req.body.pinned === true;


            if (
                !title ||
                !content
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A cím és a jegyzet szövege kötelező."

                });

            }


            const result =
                await pool.query(
                    `
                    INSERT INTO notes (
                        user_id,
                        owner_tag,
                        title,
                        text,
                        content,
                        category,
                        pinned
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7
                    )

                    RETURNING
                        id,
                        user_id,
                        owner_tag,
                        title,
                        content,
                        category,
                        pinned,
                        created_at,
                        updated_at
                    `,
                    [
                        ownerUserId,
                        ownerTag,
                        title,
                        content,
                        content,
                        category || "Egyéb",
                        pinned
                    ]
                );


            return res.status(201).json({

                success: true,

                note:
                    result.rows[0]

            });

        }
        catch (error) {

            console.error(
                "NOTE CREATE HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült létrehozni a jegyzetet."

            });

        }

    }
);


// ======================================================
// NOTES - UPDATE
// ======================================================

router.put(
    "/api/notes/:id",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedNotesUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            const noteId =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(noteId)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Érvénytelen jegyzet azonosító."

                });

            }


            const ownerUserId =
                user.id;


            const ownerTag =
                createOwnerTag(
                    ownerUserId
                );


            const title =
                typeof req.body.title ===
                "string"
                    ? req.body.title.trim()
                    : "";


            const content =
                typeof req.body.content ===
                "string"
                    ? req.body.content
                    : (
                        typeof req.body.text ===
                        "string"
                            ? req.body.text
                            : ""
                    );


            const category =
                typeof req.body.category ===
                "string"
                    ? req.body.category.trim()
                    : "Egyéb";


            const pinned =
                req.body.pinned === true;


            if (
                !title ||
                !content
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A cím és a jegyzet szövege kötelező."

                });

            }


            const result =
                await pool.query(
                    `
                    UPDATE notes

                    SET
                        title = $1,
                        text = $2,
                        content = $3,
                        category = $4,
                        pinned = $5,
                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE
                        id = $6
                        AND user_id = $7
                        AND owner_tag = $8

                    RETURNING
                        id,
                        user_id,
                        owner_tag,
                        title,
                        content,
                        category,
                        pinned,
                        created_at,
                        updated_at
                    `,
                    [
                        title,
                        content,
                        content,
                        category || "Egyéb",
                        pinned,
                        noteId,
                        ownerUserId,
                        ownerTag
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "A jegyzet nem található, vagy nem a te jegyzeted."

                });

            }


            return res.json({

                success: true,

                note:
                    result.rows[0]

            });

        }
        catch (error) {

            console.error(
                "NOTE UPDATE HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült módosítani a jegyzetet."

            });

        }

    }
);


// ======================================================
// NOTES - DELETE
// ======================================================

router.delete(
    "/api/notes/:id",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedNotesUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            const noteId =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(noteId)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Érvénytelen jegyzet azonosító."

                });

            }


            const ownerUserId =
                user.id;


            const ownerTag =
                createOwnerTag(
                    ownerUserId
                );


            const result =
                await pool.query(
                    `
                    DELETE FROM notes

                    WHERE
                        id = $1
                        AND user_id = $2
                        AND owner_tag = $3

                    RETURNING id
                    `,
                    [
                        noteId,
                        ownerUserId,
                        ownerTag
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "A jegyzet nem található, vagy nem a te jegyzeted."

                });

            }


            return res.json({

                success: true,

                message:
                    "Jegyzet törölve."

            });

        }
        catch (error) {

            console.error(
                "NOTE DELETE HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült törölni a jegyzetet."

            });

        }

    }
);


// ======================================================
// TASKS - GET
// ======================================================


module.exports = router;
