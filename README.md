# Expense Tracker

A full-stack expense tracking application with a Node.js/Express + MongoDB backend and a Next.js + TypeScript frontend.

## Architecture

```
expense-tracker/
├── client/   # Next.js 16 + React 19 + TypeScript + Tailwind CSS frontend
└── server/   # Node.js + Express + MongoDB (Mongoose) backend API
```

## Features

- User authentication (JWT-based register/login/profile)
- Expense CRUD with filtering, search, and pagination
- Per-category spending analytics
- Monthly budget tracking with actual spend and alert thresholds
- Recurring expenses (daily/weekly/monthly/yearly)
- Dashboard with metrics, trends, and charts
- CSV export of expenses

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB running locally (or a MongoDB Atlas connection string)

### Backend (`server/`)

```bash
cd server
npm install
cp .env.example .env   # configure MONGODB_URI, JWT_SECRET, PORT
npm run dev            # runs on http://localhost:5000
```

### Frontend (`client/`)

```bash
cd client
npm install
npm run dev            # runs on http://localhost:3000
```

The server's CORS allows `FRONTEND_URL` (default: `http://localhost:3000`).

## Git Workflow

This repository uses a feature-branch workflow:

- `main` — stable, production-ready code
- `develop` — integration branch where completed features are merged
- `feature/*` — one branch per feature, branched from `develop`, merged back via PR

### Workflow

```bash
git checkout develop
git pull
git checkout -b feature/expenses
# ... work ...
git add -A
git commit -m "feat(expenses): ..."
git checkout develop
git merge feature/expenses
```

## API Overview

| Method | Endpoint          | Description                          |
| ------ | ----------------- | ------------------------------------ |
| POST   | /api/auth/register| Register a new user                  |
| POST   | /api/auth/login   | Login                                |
| GET    | /api/auth/me      | Get current user                     |
| PUT    | /api/auth/profile | Update profile                       |
| GET/POST/PUT/DELETE | /api/expenses | Expense CRUD                    |
| GET    | /api/categories   | List categories                       |
| GET    | /api/categories/spending | Per-category spending          |
| GET/POST/PUT/DELETE | /api/budgets   | Budget CRUD                           |
| GET/POST/PUT/DELETE | /api/recurring | Recurring expense CRUD               |
| POST   | /api/recurring/process | Generate due recurring expenses  |
| GET    | /api/dashboard    | Dashboard metrics                     |
| GET    | /api/dashboard/export | Download expenses as CSV           |