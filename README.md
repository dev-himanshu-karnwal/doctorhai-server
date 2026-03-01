# DoctorHai Server

Backend API for DoctorHai — NestJS app with MongoDB, JWT auth, and Swagger docs.

## Prerequisites

- **Node.js** 20+ (LTS)
- **pnpm** 8+
- **MongoDB** 6+ (local or remote)

## Environment setup

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Set required variables in `.env`:

   | Variable      | Description                          |
   |---------------|--------------------------------------|
   | `MONGODB_URI` | MongoDB connection string (required) |
   | `JWT_SECRET`  | Secret for JWT signing (min 32 chars) |

   Optional (defaults in brackets): `NODE_ENV` (development), `PORT` (3000), `API_PREFIX` (api/v1), `CORS_ORIGINS` (*), `JWT_EXPIRES_IN` (15m), `JWT_COOKIE_NAME` (access_token), `BCRYPT_ROUNDS` (12), `MAIL_*` (see `.env.example`).

## Running the app

- **Development** (watch mode):

  ```bash
  pnpm install
  pnpm run start:dev
  ```

- **Production** (build then run):

  ```bash
  pnpm run build
  pnpm run start:prod
  ```

- **Docker** (API + MongoDB):

  ```bash
  docker compose up --build
  ```

  API: `http://localhost:4000`. Ensure `.env.development` (or env vars) is set for the `api` service; MongoDB runs in the stack on port 27018 (host).

## Tests and lint

- **Lint:** `pnpm run lint`
- **Format check:** `pnpm run format:check`
- **Format (fix):** `pnpm run format`

(Unit/e2e tests can be added and run via a `test` script when configured.)

## Docs and guidelines

- **API docs (Swagger):** [http://localhost:3000/api/docs](http://localhost:3000/api/docs) (or the port you set; use 4000 when using Docker).
- **Project guidelines:** [GUIDELINES.md](./GUIDELINES.md)
