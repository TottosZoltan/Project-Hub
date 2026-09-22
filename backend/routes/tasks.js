const express = require("express");
const { pool } = require("../database");
const { getAuthenticatedTasksUser, createOwnerTag } = require("../middleware/auth");
const router = require("express").Router();

router.get(
    "/api/tasks",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedTasksUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges a feladatokhoz."

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
                        description,
                        completed,
                        priority,
                        category,
                        due_date,
                        reminder_minutes,
                        reminder_sent_at,
                        pinned,
                        created_at,
                        updated_at

                    FROM tasks

                    WHERE
                        user_id = $1
                        AND owner_tag = $2

                    ORDER BY
                        completed ASC,
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

                tasks:
                    result.rows

            });

        }
        catch (error) {

            console.error(
                "TASKS GET HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült betölteni a feladatokat."

            });

        }

    }
);


// ======================================================
// TASKS - CREATE
// ======================================================

router.post(
    "/api/tasks",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedTasksUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges a feladathoz."

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


            const description =
                typeof req.body.description ===
                "string"
                    ? req.body.description
                    : "";


            const completed =
                req.body.completed === true;


            const priority =
                typeof req.body.priority ===
                "string"
                    ? req.body.priority.trim()
                    : "normal";


            const category =
                typeof req.body.category ===
                "string"
                    ? req.body.category.trim()
                    : "Egyéb";


            const pinned =
                req.body.pinned === true;


            const reminderMinutes =
                req.body.reminder_minutes !== undefined
                    ? (req.body.reminder_minutes === null || req.body.reminder_minutes === "" ? null : Number(req.body.reminder_minutes))
                    : (req.body.reminderMinutes !== undefined ? (req.body.reminderMinutes === null || req.body.reminderMinutes === "" ? null : Number(req.body.reminderMinutes)) : null);

            if (reminderMinutes !== null && (!Number.isInteger(reminderMinutes) || reminderMinutes < 0 || reminderMinutes > 10080)) {
                return res.status(400).json({
                    success: false,
                    message: "Érvénytelen emlékeztető idő."
                });
            }


            let dueDate = null;


            if (
                req.body.due_date !== null &&
                req.body.due_date !== undefined &&
                req.body.due_date !== ""
            ) {

                const parsedDate =
                    new Date(
                        req.body.due_date
                    );


                if (
                    Number.isNaN(
                        parsedDate.getTime()
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Érvénytelen határidő."

                    });

                }


                dueDate =
                    parsedDate;

            }


            if (!title) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A feladat címe kötelező."

                });

            }


            const result =
                await pool.query(
                    `
                    INSERT INTO tasks (
                        user_id,
                        owner_tag,
                        title,
                        description,
                        completed,
                        priority,
                        category,
                        due_date,
                        reminder_minutes,
                        pinned
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10
                    )

                    RETURNING
                        id,
                        user_id,
                        owner_tag,
                        title,
                        description,
                        completed,
                        priority,
                        category,
                        due_date,
                        reminder_minutes,
                        reminder_sent_at,
                        pinned,
                        created_at,
                        updated_at
                    `,
                    [
                        ownerUserId,
                        ownerTag,
                        title,
                        description,
                        completed,
                        priority || "normal",
                        category || "Egyéb",
                        dueDate,
                        reminderMinutes,
                        pinned
                    ]
                );


            return res.status(201).json({

                success: true,

                task:
                    result.rows[0]

            });

        }
        catch (error) {

            console.error(
                "TASK CREATE HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült létrehozni a feladatot."

            });

        }

    }
);


// ======================================================
// TASKS - UPDATE
// ======================================================

router.put(
    "/api/tasks/:id",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedTasksUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            const taskId =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(taskId)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Érvénytelen feladat azonosító."

                });

            }


            const ownerUserId =
                user.id;


            const ownerTag =
                createOwnerTag(
                    ownerUserId
                );


            const existingResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        user_id,
                        owner_tag,
                        title,
                        description,
                        completed,
                        priority,
                        category,
                        due_date,
                        reminder_minutes,
                        reminder_sent_at,
                        pinned,
                        created_at,
                        updated_at

                    FROM tasks

                    WHERE
                        id = $1
                        AND user_id = $2
                        AND owner_tag = $3

                    LIMIT 1
                    `,
                    [
                        taskId,
                        ownerUserId,
                        ownerTag
                    ]
                );


            if (
                existingResult.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "A feladat nem található, vagy nem a te feladatod."

                });

            }


            // EZ VOLT A HIBÁS RÉSZ
            const existingTask =
                existingResult.rows[0];


            const title =
                req.body.title !== undefined
                    ? (
                        typeof req.body.title ===
                        "string"
                            ? req.body.title.trim()
                            : existingTask.title
                    )
                    : existingTask.title;


            const description =
                req.body.description !== undefined
                    ? (
                        typeof req.body.description ===
                        "string"
                            ? req.body.description
                            : existingTask.description
                    )
                    : existingTask.description;


            const completed =
                req.body.completed !== undefined
                    ? req.body.completed === true
                    : existingTask.completed;


            const priority =
                req.body.priority !== undefined
                    ? (
                        typeof req.body.priority ===
                        "string"
                            ? req.body.priority.trim()
                            : existingTask.priority
                    )
                    : existingTask.priority;


            const category =
                req.body.category !== undefined
                    ? (
                        typeof req.body.category ===
                        "string"
                            ? req.body.category.trim()
                            : existingTask.category
                    )
                    : existingTask.category;


            const pinned =
                req.body.pinned !== undefined
                    ? req.body.pinned === true
                    : existingTask.pinned;

            const reminderMinutes =
                req.body.reminder_minutes !== undefined
                    ? (req.body.reminder_minutes === null || req.body.reminder_minutes === "" ? null : Number(req.body.reminder_minutes))
                    : (req.body.reminderMinutes !== undefined ? (req.body.reminderMinutes === null || req.body.reminderMinutes === "" ? null : Number(req.body.reminderMinutes)) : existingTask.reminder_minutes);

            if (reminderMinutes !== null && (!Number.isInteger(reminderMinutes) || reminderMinutes < 0 || reminderMinutes > 10080)) {
                return res.status(400).json({
                    success: false,
                    message: "Érvénytelen emlékeztető idő."
                });
            }


            let dueDate =
                existingTask.due_date;


            if (
                req.body.due_date !== undefined
            ) {

                if (
                    req.body.due_date === null ||
                    req.body.due_date === ""
                ) {

                    dueDate = null;

                }
                else {

                    const parsedDate =
                        new Date(
                            req.body.due_date
                        );


                    if (
                        Number.isNaN(
                            parsedDate.getTime()
                        )
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Érvénytelen határidő."

                        });

                    }


                    dueDate =
                        parsedDate;

                }

            }


            if (!title) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A feladat címe kötelező."

                });

            }


            const result =
                await pool.query(
                    `
                    UPDATE tasks

                    SET
                        title = $1,
                        description = $2,
                        completed = $3,
                        priority = $4,
                        category = $5,
                        due_date = $6,
                        reminder_minutes = $7,
                        reminder_sent_at = NULL,
                        pinned = $8,
                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE
                        id = $9
                        AND user_id = $10
                        AND owner_tag = $11

                    RETURNING
                        id,
                        user_id,
                        owner_tag,
                        title,
                        description,
                        completed,
                        priority,
                        category,
                        due_date,
                        reminder_minutes,
                        reminder_sent_at,
                        pinned,
                        created_at,
                        updated_at
                    `,
                    [
                        title,
                        description,
                        completed,
                        priority || "normal",
                        category || "Egyéb",
                        dueDate,
                        reminderMinutes,
                        pinned,
                        taskId,
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
                        "A feladat nem található, vagy nem a te feladatod."

                });

            }


            return res.json({

                success: true,

                task:
                    result.rows[0]

            });

        }
        catch (error) {

            console.error(
                "TASK UPDATE HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült módosítani a feladatot."

            });

        }

    }
);

// ======================================================
// TASKS - DELETE
// ======================================================

router.delete(
    "/api/tasks/:id",
    async function (req, res) {

        try {

            const user =
                await getAuthenticatedTasksUser(
                    req
                );


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Érvényes bejelentkezés szükséges."

                });

            }


            const taskId =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(taskId)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Érvénytelen feladat azonosító."

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
                    DELETE FROM tasks

                    WHERE
                        id = $1

                        AND user_id = $2

                        AND owner_tag = $3

                    RETURNING id
                    `,
                    [
                        taskId,
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
                        "A feladat nem található, vagy nem a te feladatod."

                });

            }


            return res.json({

                success: true,

                message:
                    "Feladat törölve."

            });

        }
        catch (error) {

            console.error(
                "TASK DELETE HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Nem sikerült törölni a feladatot."

            });

        }

    }
);


// ======================================================

module.exports = router;
