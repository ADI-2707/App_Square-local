# App Square Local

A full-stack recipe management system for industrial devices, built with **FastAPI** (Python) on the backend and **React + Vite** on the frontend. It lets operators and admins define reusable device **templates** (groups of tags), build **recipes** on top of those templates, and push tag values out to devices — with role-based access, audit logging, and a configurable tag-name source (Excel-backed by default).

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Running Tests](#running-tests)
- [Data Model](#data-model)

## Overview

App Square Local models a manufacturing/device-configuration workflow:

- A **Template Group** defines a set of **devices** and the **tags** available on each device.
- A **Recipe Group** is created against a template group, and individual **Recipes** are built inside it.
- Each recipe assigns concrete **tag values** to the devices defined by its template.
- Tag names can be resolved/searched against an external source (currently an Excel workbook, parsed directly from the `.xlsx` file) so recipe tags stay consistent with the naming used elsewhere in the plant.
- All authentication, admin actions, and system events are logged and queryable by admins, with automatic log cleanup on a schedule.

## Features

- 🔐 JWT-based authentication with role-based access control (`admin` / `operator`)
- 🧑‍🤝‍🧑 Operator account management (activate/deactivate, reset password) from an admin panel
- 🗂️ Template groups with devices and tags
- 📋 Recipe groups and recipes built on top of templates, with per-device tag values
- 🔎 Tag name resolution and search backed by a configurable source (Excel by default)
- 📝 System/action logging with health checks and automatic retention-based cleanup
- ⚛️ React SPA with protected routes and an admin-only area

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) + [Starlette](https://www.starlette.io/)
- [SQLAlchemy](https://www.sqlalchemy.org/) ORM (SQLite by default)
- [python-jose](https://github.com/mpdavis/python-jose) for JWT handling
- [passlib](https://passlib.readthedocs.io/) for password hashing
- [pydantic](https://docs.pydantic.dev/) for request/response schemas
- [Uvicorn](https://www.uvicorn.org/) ASGI server

**Frontend**
- [React 19](https://react.dev/) + [React Router 7](https://reactrouter.com/)
- [Vite 7](https://vite.dev/) for dev server/build tooling
- [Axios](https://axios-http.com/) for API calls
- [ESLint](https://eslint.org/) for linting

## Project Structure

```
App_Square-local/
├── backend/
│   ├── app/
│   │   ├── commands/       # Write-side operations (auth, admin, recipes, templates)
│   │   ├── core/           # Cross-cutting concerns (logging, transactions)
│   │   ├── models/         # SQLAlchemy models (User, Recipe, Template, Tag, Log, ...)
│   │   ├── queries/        # Read-side data access
│   │   ├── routes/         # FastAPI routers (auth, admin, recipes, templates)
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── services/       # Business logic
│   │   ├── utils/          # JWT handling, security, dependencies, middleware
│   │   ├── config.py       # Environment-driven configuration
│   │   ├── database.py     # SQLAlchemy engine/session setup
│   │   ├── db_migrations.py
│   │   └── main.py         # FastAPI app entrypoint
│   └── tests/               # Pytest test suite
└── frontend/
    ├── src/
    │   ├── components/     # Layout, modals, workspace, and shared components
    │   ├── context/        # Auth, Entity, Recipe, UI-lock, Workspace contexts
    │   ├── pages/           # Login, Home, Admin (incl. Logs) pages
    │   ├── Utility/         # API client and icon mapper
    │   └── styles/          # Design tokens
    ├── index.html
    └── vite.config.js
```

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Git

## Getting Started

### Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install fastapi uvicorn sqlalchemy python-jose[cryptography] passlib[bcrypt] python-dotenv pytz pydantic pytest httpx

# Create a .env file in backend/ (see Environment Variables below)

# Run the API server
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`, with interactive docs at `http://127.0.0.1:8000/docs`.

> On startup, the app creates its tables, runs any pending migrations, and seeds a root admin user plus four default operator accounts (`operator1`–`operator4`) based on your `.env` values.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on Vite's default port (`http://localhost:5173`) and expects the backend API to be reachable (configure the base URL in `src/Utility/api.js` if needed).

Other useful scripts:

```bash
npm run build     # Production build
npm run preview   # Preview the production build
npm run lint       # Run ESLint
```

## Environment Variables

Create a `backend/.env` file with the following keys:

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | Secret used to sign JWTs | `super-secret-key` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes | `60` |
| `DATABASE_URL` | SQLAlchemy database URL (SQLite paths are resolved relative to `backend/`) | `sqlite:///./app_square_local.db` |
| `ROOT_ADMIN_USERNAME` | Username seeded for the root admin | `admin` |
| `ROOT_ADMIN_PASSWORD` | Password seeded for the root admin | `change-me` |
| `ALLOWED_ORIGINS` | Comma-separated list of CORS origins | `http://localhost:5173` |
| `TAG_SOURCE_KIND` | Tag source type (`excel` or `database`) | `excel` |
| `TAG_SOURCE_EXCEL_PATH` | Path to the Excel workbook used for tag lookups | `./tags.xlsx` |
| `TAG_SOURCE_EXCEL_SHEET` | Sheet name to read (defaults to the first sheet) | `Tags` |
| `TAG_SOURCE_LOOKUP_COLUMN` | Column letter holding lookup values | `A` |
| `TAG_SOURCE_VALUE_COLUMN` | Column letter holding resolved tag names | `B` |
| `LOG_RETENTION_DAYS` | Days to retain log entries before cleanup | `90` |
| `LOG_CLEANUP_INTERVAL_MINUTES` | How often the cleanup task runs | `60` |

## API Overview

All endpoints are served under FastAPI's default root, grouped by router prefix:

| Prefix | Purpose |
|---|---|
| `/auth` | Login, logout, current user profile |
| `/admin` | Password changes, operator management, system logs & log health |
| `/templates` | Template groups, devices, tags, tag resolution/search |
| `/recipes` | Recipe groups, recipes, and per-device tag values |

Full request/response schemas and an interactive testing UI are available at `/docs` (Swagger) once the backend is running.

## Running Tests

```bash
cd backend
pytest
```

The test suite spins up an isolated SQLite database (`backend/test.db`) and exercises auth, admin, recipe, template, tag-source, and recipe-security flows.

## Data Model

Core entities and relationships:

- **User** — `admin` or `operator`, with lockout tracking and token versioning for invalidation.
- **TemplateGroup** → has many **DeviceInstance** and **RecipeGroup**.
- **RecipeGroup** (tied to a `TemplateGroup`) → has many **Recipe**.
- **Recipe** → has many **RecipeDevice** → each has many **RecipeTagValue** (tag name, data type, value).
- **Tag** / tag-source lookups — resolve external lookup values to canonical tag names.
- **Log** / **TemplateChangeLog** — audit trail for system and template activity.
