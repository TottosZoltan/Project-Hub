const express = require("express");
const { pool } = require("../database");

const router = express.Router();

router.get(
    "/",
    function (req, res) {

        res.json({

            success: true,

            message:
                "Project Hub backend működik."

        });

    }
);


// ======================================================
// REGISTER
// ======================================================

router.get(
    "/api/database/test",
    async function (req, res) {

        try {

            const result =
                await pool.query(
                    "SELECT NOW() AS now"
                );


            return res.json({

                success: true,

                database: true,

                time:
                    result.rows[0].now

            });

        }
        catch (error) {

            console.error(
                "DATABASE TEST HIBA:",
                error
            );


            return res.status(500).json({

                success: false,

                database: false,

                message:
                    "Adatbázis hiba."

            });

        }

    }
);


// ======================================================
// NOTES - GET
// ======================================================


module.exports = router;
