# Supabase Local Development

This folder contains the Supabase configuration, migrations, and seed data for local development. It is located in `backend/supabase/`.

## Getting Started

1.  **Install Supabase CLI**:
    ```bash
    brew install supabase/tap/supabase
    ```
    (Or see [Supabase CLI docs](https://supabase.com/docs/guides/cli/getting-started) for other platforms)

2.  **Start Local Supabase**:
    From the root of the project:
    ```bash
    npm run supabase:start
    ```

3.  **View Local Studio**:
    Once started, visit [http://localhost:54323](http://localhost:54323) to manage your local database.

## Useful Commands (from project root)

- `npm run supabase:start`: Start local services.
- `npm run supabase:stop`: Stop local services.
- `npm run supabase:reset`: Reset local database and apply migrations + seed data.
- `npm run supabase:migration:new <name>`: Create a new migration file.
- `npm run supabase:status`: View local service status and API keys.

## Connecting from the App

The local API URL and Keys are available via `npm run supabase:status`. Use the `anon` key in your `apps/web/.env.development` file.
