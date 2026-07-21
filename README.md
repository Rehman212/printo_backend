# Printoe Backend API

NestJS + Prisma + PostgreSQL authentication API for the Printoe frontend.

## Modules

| Module | Path | Purpose |
|--------|------|---------|
| `prisma/` | DB client | Prisma service |
| `auth/` | `/api/auth` | Signup, login, JWT, `/me` |
| `users/` | `/api/users` | User profile |
| `dashboard/` | `/api/dashboard` | Protected dashboard (JWT required) |
| `checkout/` | `/api/checkout` | Protected checkout (JWT required) |
| `common/` | — | Guards, decorators |

## Setup

```bash
# .env already contains:
# DATABASE_URL="postgresql://postgres:786786@localhost:5432/u_printing?schema=public"

npm install
npx prisma migrate dev
npm run start:dev
```

API base: `http://localhost:4000/api`

## Auth endpoints

- `POST /api/auth/signup` — `{ name, email, password, company? }`
- `POST /api/auth/login` — `{ email, password }`
- `GET /api/auth/me` — Bearer token required

Protected (JWT Bearer required):

- `GET /api/dashboard`
- `POST /api/checkout`
- `GET /api/users/me`

## Password rules (signup)

- Min 8 characters
- At least one letter and one number
