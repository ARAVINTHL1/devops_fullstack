# MS Garments Hub

Full-stack B2B textile platform with:

- React + Vite frontend
- Express API backend
- MongoDB persistence
- Role-based auth (`admin`, `employee`, `buyer`)

## Setup

1. Install dependencies:

```sh
npm install
```

2. Create your environment file:

```sh
copy .env.example .env
```

3. Make sure MongoDB is running and `MONGODB_URI` in `.env` is correct.

## Run

Run frontend + backend together:

```sh
npm run dev:full
```

Or run separately:

```sh
npm run dev
npm run dev:server
```

Frontend: `http://localhost:8080`

Backend API: `http://localhost:5000/api`

## Authentication Rules

- Admin default account is seeded in MongoDB only if no admin exists.
- Employee accounts can be created only by admin from the admin panel.
- Buyer accounts can log in only after successful signup.

## Key Scripts

- `npm run dev` -> frontend dev server
- `npm run dev:server` -> backend dev server
- `npm run dev:full` -> run both frontend + backend
- `npm run build` -> frontend production build
