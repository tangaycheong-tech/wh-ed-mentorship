# WH ED NC Mentorship Platform

A web application for the Woodlands Hospital Emergency Department Nurse Clinician (NC) Mentorship Program. Built with **Next.js 14**, **Supabase PostgreSQL**, and **Tailwind CSS**.

## Features

- **JWT Authentication** — Secure login with HTTP-only cookies
- **Role-based dashboards** — Mentor (NC), Mentee (SSN), and Admin views
- **Mentor tools** — Create/manage checklists for mentees, view reflections
- **Mentee tools** — Set SMART goals, write learning reflections
- **Admin panel** — Manage users, create mentor-mentee pairings, view program overview

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase PostgreSQL (Neon serverless)
- Tailwind CSS
- jose (JWT)
- bcryptjs (password hashing)

## Local Setup

### 1. Install dependencies

```bash
cd wh-ed-mentorship-app
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — A long random string (min 32 chars)

### 3. Initialize the database

Run the SQL schema in your Supabase SQL editor or via psql:

```bash
psql $DATABASE_URL -f db/schema.sql
```

### 4. Create your admin account

Visit `/signup` and create an account, then manually update your role to `admin` in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Deploy

## Project Structure

```
app/
  api/
    auth/           # Login, logout, signup, session
    admin/          # User & assignment management
    mentor/         # Mentor-specific routes
    mentee/         # (future)
    checklists/     # Checklist CRUD
    checklist-items/ # Item toggle
    reflections/    # Reflection CRUD
    goals/          # Goal CRUD
  dashboard/
    mentor/         # Mentor pages
    mentee/         # Mentee pages
    admin/          # Admin pages
  login/            # Login page
  signup/           # Signup page
db/
  schema.sql        # Full database schema
lib/
  auth.ts           # JWT auth helpers
  db.ts             # Neon DB client
types/
  index.ts          # TypeScript types
```
# Vercel deployment trigger
# Vercel IPv6 deploy
# Vercel IP deploy
# IPv6 brackets deploy
