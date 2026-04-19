# Uzhavan Sahay - Project Structure

## Overview

This project is now organized as a monorepo with **separate frontend and backend directories**.

```
project/
├── frontend/          # React + Vite application
│   ├── src/          # Frontend source code
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── backend/          # Node.js/Express server
│   ├── src/          # Backend source code
│   ├── package.json
│   └── ...
├── ml_models/        # ML training scripts (shared)
├── documentation/    # Project documentation
└── package.json      # Root package.json with monorepo scripts
```

## Quick Start

### Install Dependencies
```bash
npm run install:all
```

### Development

**Run both frontend and backend:**
```bash
npm run dev
```

**Run only frontend:**
```bash
npm run dev:frontend
```

**Run only backend:**
```bash
npm run dev:backend
```

### Production

**Build frontend:**
```bash
npm run build
```

**Start backend server:**
```bash
npm run start:server
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install dependencies for all packages |
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start frontend dev server (port 8080) |
| `npm run dev:backend` | Start backend dev server (port 5000) |
| `npm run build` | Build frontend for production |
| `npm run build:dev` | Build frontend in development mode |
| `npm run start:server` | Start backend in production mode |
| `npm run lint` | Run ESLint on frontend |
| `npm run test` | Run frontend tests |
| `npm run test:watch` | Run frontend tests in watch mode |

## Directory Structure

### Frontend (`/frontend`)
- **src/components/** - React components
- **src/pages/** - Page components
- **src/lib/** - Utilities and API client
- **src/hooks/** - Custom React hooks
- **src/assets/** - Static assets

### Backend (`/backend`)
- **src/index.js** - Entry point
- **src/routes/** - API routes
- **src/models/** - Mongoose models
- **src/middleware/** - Express middleware
- **src/utils/** - Utility functions

### Shared Resources
- **ml_models/** - ML model training scripts
- **documentation/** - Project documentation and specifications

## Environment Variables

Create `.env` files in each directory as needed:

- **frontend/.env** - Frontend environment variables
- **backend/.env** - Backend environment variables

## Notes

- Frontend communicates with backend via proxy at `/api` (configured in vite.config.ts)
- Frontend runs on port 8080
- Backend runs on port 5000
- Both can be run together with `npm run dev` from the root directory
