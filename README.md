# AI-assisted CMS prototype

This monorepo contains a Next.js reader/writer frontend and a FastAPI backend. The writer URL is intentionally unprotected in this prototype. The backend owns provider credentials; do not add DeepSeek secrets to frontend environment variables.

## Requirements

- Node.js and pnpm (the repository pins pnpm in the root `package.json`)
- Python 3.12+ and [uv](https://docs.astral.sh/uv/)

## Configure local environment

Copy `.env.example` to the relevant app environment files, then adjust values if needed:

- `apps/api/.env` for FastAPI, SQLite, CORS, and DeepSeek settings
- `apps/web/.env.local` for the frontend API URLs

Keep `DEEPSEEK_API_KEY` only in `apps/api/.env`. The example leaves it empty; the health endpoint does not require it.

## Install dependencies

From the repository root:

```sh
pnpm install
```

From `apps/api`:

```sh
uv sync
uv run alembic upgrade head
```

## Run the applications

Start each app in its own terminal.

Terminal 1, from `apps/api`:

```sh
uv run uvicorn cms_api.main:app --reload
```

The API is available at `http://localhost:8000`; its health check is `http://localhost:8000/health`.

Terminal 2, from the repository root:

```sh
pnpm --filter @cms/web dev
```

The frontend is available at `http://localhost:3000`.
