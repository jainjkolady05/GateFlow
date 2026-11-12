# GateFlow – Smart Campus Outpass Management

A small full-stack portfolio project built with React, Tailwind CSS, Node.js, Express, and SQLite.

## Features
- Student and warden demo accounts with role-based access
- Student outpass application form and application history
- Warden dashboard with summary statistics
- Approve/reject requests (rejection reason supported)
- Mark approved students as departed and returned
- Search/filter applications
- Activity log for important status changes
- Responsive dashboard layout

## Requirements
- Node.js 18+ and npm

## Run locally

### 1. Start the backend
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
The API runs at `http://localhost:5000`. The SQLite database is created automatically at `server/data/outpass.db` and seeded with demo accounts.

### 2. Start the frontend (new terminal)
```bash
cd client
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Student | student@gateflow.demo | Student@123 |
| Warden | warden@gateflow.demo | Warden@123 |

Use these accounts for local demonstration. Change demo credentials and JWT secret before deploying.

## Workflow
`Pending → Approved → Outside → Returned`
A warden can also reject a pending application. Only approved requests can be marked Outside, and only Outside requests can be marked Returned.

## Project structure
```text
gateflow/
├── client/   # React + Vite + Tailwind frontend
└── server/   # Express REST API + SQLite database
```

## Notes
- This is a portfolio/demo application, not a production campus security system.
- For production, add email/OTP verification, password reset, stronger audit controls, HTTPS, backups, and institution-approved data retention policies.
