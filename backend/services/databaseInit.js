const { pool } = require("../database");

async function initializeDatabase() {

    console.log(
        "Adatbázis inicializálása..."
    );


    // ==================================================
    // USERS
    // ==================================================

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,

            username VARCHAR(100)
                UNIQUE NOT NULL,

            email VARCHAR(255),

            password_hash TEXT NOT NULL,

            created_at
                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            updated_at
                TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);


    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS
        email VARCHAR(255);
    `);


    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS
        password_hash TEXT;
    `);


    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS
        created_at
        TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);


    await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS
        updated_at
        TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_image TEXT;
`);

    // ==================================================
    // AUTH TOKENS
    // ==================================================

    await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_tokens (
            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            token_hash TEXT UNIQUE NOT NULL,

            expires_at TIMESTAMP NOT NULL,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP
        );
    `);


    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        auth_tokens_user_id_idx
        ON auth_tokens(user_id);
    `);


    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        auth_tokens_expires_at_idx
        ON auth_tokens(expires_at);
    `);


    await pool.query(`
        DELETE FROM auth_tokens
        WHERE expires_at < CURRENT_TIMESTAMP;
    `);


    // ==================================================
    // NOTES
    // ==================================================

    await pool.query(`
        CREATE TABLE IF NOT EXISTS notes (
            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            owner_tag TEXT NOT NULL,

            title TEXT NOT NULL DEFAULT '',

            text TEXT NOT NULL DEFAULT '',

            content TEXT NOT NULL DEFAULT '',

            category VARCHAR(100)
                NOT NULL DEFAULT 'Egyéb',

            pinned BOOLEAN
                NOT NULL DEFAULT FALSE,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP
        );
    `);


    // ==================================================
    // RÉGI NOTES TÁBLA MIGRÁCIÓ
    // ==================================================

    await pool.query(`
        ALTER TABLE notes
        ADD COLUMN IF NOT EXISTS
        user_id INTEGER;
    `);


    await pool.query(`
        ALTER TABLE notes
        ADD COLUMN IF NOT EXISTS
        owner_tag TEXT;
    `);


    await pool.query(`
        ALTER TABLE notes
        ADD COLUMN IF NOT EXISTS
        title TEXT
        NOT NULL DEFAULT '';
    `);


    await pool.query(`
        ALTER TABLE notes
        ADD COLUMN IF NOT EXISTS
        text TEXT
        NOT NULL DEFAULT '';
    `);


    await pool.query(`
        ALTER TABLE notes
        ADD COLUMN IF NOT EXISTS
        content TEXT
        NOT NULL DEFAULT '';
    `);


    await pool.query(`
        ALTER TABLE notes
        ADD COLUMN IF NOT EXISTS
        category VARCHAR(100)
        NOT NULL DEFAULT 'Egyéb';
    `);


    await pool.query(`
        ALTER TABLE notes
        ADD COLUMN IF NOT EXISTS
        pinned BOOLEAN
        NOT NULL DEFAULT FALSE;
    `);


    await pool.query(`
        ALTER TABLE notes
        ADD COLUMN IF NOT EXISTS
        created_at
        TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);


    await pool.query(`
        ALTER TABLE notes
        ADD COLUMN IF NOT EXISTS
        updated_at
        TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);


    // ==================================================
    // TEXT <-> CONTENT SZINKRONIZÁLÁS
    // ==================================================

    await pool.query(`
        UPDATE notes
        SET content = text
        WHERE
            text IS NOT NULL
            AND (
                content IS NULL
                OR content = ''
            )
            AND text <> '';
    `);


    await pool.query(`
        UPDATE notes
        SET text = content
        WHERE
            content IS NOT NULL
            AND content <> ''
            AND (
                text IS NULL
                OR text = ''
            );
    `);


    // ==================================================
    // OWNER TAG KITÖLTÉS
    // ==================================================

    await pool.query(`
        UPDATE notes
        SET owner_tag =
            'USER-' || user_id::TEXT
        WHERE
            owner_tag IS NULL
            AND user_id IS NOT NULL;
    `);


    // ==================================================
    // USER ID FOREIGN KEY
    // ==================================================

    await pool.query(`
        DO $$
        BEGIN

            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname =
                    'notes_user_id_fkey'
            )
            THEN

                ALTER TABLE notes
                ADD CONSTRAINT
                    notes_user_id_fkey
                FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE;

            END IF;

        END
        $$;
    `);


    // ==================================================
    // NOTES INDEXEK
    // ==================================================

    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        notes_user_id_idx
        ON notes(user_id);
    `);


    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        notes_user_updated_idx
        ON notes(
            user_id,
            updated_at DESC
        );
    `);


    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        notes_owner_tag_idx
        ON notes(owner_tag);
    `);


    // ==================================================
    // STEAM ACCOUNTS
    // ==================================================

    await pool.query(`
        CREATE TABLE IF NOT EXISTS steam_accounts (
            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL UNIQUE
                REFERENCES users(id)
                ON DELETE CASCADE,

            steam_id VARCHAR(32) NOT NULL UNIQUE,

            steam_name TEXT,

            avatar TEXT,

            profile_url TEXT,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP
        );
    `);


    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        steam_accounts_user_id_idx
        ON steam_accounts(user_id);
    `);


    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        steam_accounts_steam_id_idx
        ON steam_accounts(steam_id);
    `);


    // ==================================================
    // STEAM LINK STATES
    // ==================================================

    await pool.query(`
        CREATE TABLE IF NOT EXISTS steam_link_states (
            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            state_hash TEXT UNIQUE NOT NULL,

            expires_at TIMESTAMP NOT NULL,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP
        );
    `);


    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        steam_link_states_user_id_idx
        ON steam_link_states(user_id);
    `);


    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        steam_link_states_expires_at_idx
        ON steam_link_states(expires_at);
    `);


    await pool.query(`
        DELETE FROM steam_link_states
        WHERE expires_at < CURRENT_TIMESTAMP;
    `);


    // ==================================================
    // CUSTOM GAMES
    // ==================================================
    await pool.query(`
        CREATE TABLE IF NOT EXISTS custom_games (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(120) NOT NULL,
            image TEXT DEFAULT '',
            minutes INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(30) NOT NULL DEFAULT 'backlog',
            favorite BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS custom_games_user_id_idx ON custom_games(user_id);`);

    // ==================================================
    // PLACES
    // ==================================================
    await pool.query(`
        CREATE TABLE IF NOT EXISTS places (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(160) NOT NULL,
            category VARCHAR(80) NOT NULL DEFAULT 'Egyéb',
            address TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            favorite BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS places_user_id_idx ON places(user_id);`);


    console.log(
        "Adatbázis inicializálása kész."
    );
}


// ======================================================
// TASKS DATABASE INITIALIZATION
// ======================================================


async function initializeTasksDatabase() {

    console.log(
        "Tasks adatbázis inicializálása..."
    );


    // ==================================================
    // TASKS TÁBLA
    // ==================================================

    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,

            user_id INTEGER,

            owner_tag TEXT,

            title TEXT
                NOT NULL DEFAULT '',

            description TEXT
                NOT NULL DEFAULT '',

            completed BOOLEAN
                NOT NULL DEFAULT FALSE,

            priority VARCHAR(50)
                NOT NULL DEFAULT 'normal',

            category VARCHAR(100)
                NOT NULL DEFAULT 'Egyéb',

            due_date TIMESTAMP,

            pinned BOOLEAN
                NOT NULL DEFAULT FALSE,

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP
        );
    `);


    // Push subscriptions for background notifications.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER;
    `);

    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
        ON push_subscriptions(user_id);
    `);

    await pool.query(`
        ALTER TABLE push_subscriptions
        ADD COLUMN IF NOT EXISTS test_scheduled_at TIMESTAMP;
    `);

    // ==================================================
    // RÉGI TASKS TÁBLA MIGRÁCIÓ
    // ==================================================

    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        user_id INTEGER;
    `);


    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        owner_tag TEXT;
    `);


    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        title TEXT
        NOT NULL DEFAULT '';
    `);


    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        description TEXT
        NOT NULL DEFAULT '';
    `);


    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        completed BOOLEAN
        NOT NULL DEFAULT FALSE;
    `);


    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        priority VARCHAR(50)
        NOT NULL DEFAULT 'normal';
    `);


    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        category VARCHAR(100)
        NOT NULL DEFAULT 'Egyéb';
    `);


    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        due_date TIMESTAMP;
    `);


    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        pinned BOOLEAN
        NOT NULL DEFAULT FALSE;
    `);


    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        created_at
        TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);


    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS
        updated_at
        TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);


    // ==================================================
    // OWNER TAG KITÖLTÉS
    // ==================================================

    await pool.query(`
        UPDATE tasks
        SET owner_tag =
            'USER-' || user_id::TEXT
        WHERE
            owner_tag IS NULL
            AND user_id IS NOT NULL;
    `);


    // ==================================================
    // TASKS USER ID FOREIGN KEY
    // ==================================================

    await pool.query(`
        DO $$
        BEGIN

            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname =
                    'tasks_user_id_fkey'
            )
            THEN

                ALTER TABLE tasks
                ADD CONSTRAINT
                    tasks_user_id_fkey
                FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE;

            END IF;

        END
        $$;
    `);


    // ==================================================
    // TASKS INDEXEK
    // ==================================================

    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        tasks_user_id_idx
        ON tasks(user_id);
    `);


    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        tasks_user_updated_idx
        ON tasks(
            user_id,
            updated_at DESC
        );
    `);


    await pool.query(`
        CREATE INDEX IF NOT EXISTS
        tasks_owner_tag_idx
        ON tasks(owner_tag);
    `);


    console.log(
        "Tasks adatbázis inicializálása kész."
    );
}


// ======================================================
// AUTH TOKEN HELPERS
// ======================================================


module.exports = {
    initializeDatabase,
    initializeTasksDatabase
};
