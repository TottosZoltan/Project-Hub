const PORT = process.env.PORT || 10000;

const FRONTEND_URL =
    "https://tottoszoltan.github.io";

const PROJECT_HUB_URL =
    "https://tottoszoltan.github.io/Project-Hub";

const BACKEND_URL =
    "https://project-hub-backend-1.onrender.com";

const STEAM_API_KEY =
    process.env.STEAM_API_KEY;

// Optional SteamGridDB API key. The artwork fallback also has a
// legacy public-endpoint compatibility path when this is not set.
const STEAMGRIDDB_API_KEY =
    process.env.STEAMGRIDDB_API_KEY;

module.exports = {
    PORT,
    FRONTEND_URL,
    PROJECT_HUB_URL,
    BACKEND_URL,
    STEAM_API_KEY,
    STEAMGRIDDB_API_KEY
};
