# TCBA - Tennessee Coalition for Better Aging

## Project Overview
Repo for TCBA, a coalition management platform with:

**backend/** : Node.js/Express REST API (TypeScript, PostgreSQL)
**frontend/** : React app (TypeScript, Vite, Tailwind CSS)

## Code Structure
**backend/controllers/, routes/, services/, middleware/, config/, prisma/**: API logic, endpoints, external services, middleware, configs, and database schema definitions
**frontend/src/pages/**: Main React pages/components with admin and user pages

## Local Setup

### Install dependencies
```bash
cd backend
npm install
cd frontend
npm install
```

### Start backend
```bash
cd backend
npm run dev
```

### Start frontend
```bash
cd frontend
npm run dev
```

## PostgreSQL Database Setup

Set up Prisma:
```bash
cd backend
npx prisma db push
npx prisma generate
```

### Supabase Setup

- **Docker Desktop** must be installed and running ([download here](https://docs.docker.com/desktop))
  - Required for local Supabase instance to run PostgreSQL and other services

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase in project**
   ```bash
   cd backend
   npx supabase init
   ```

3. **Start and Stop local Supabase**
   ```bash
   npx supabase start
   npx supabase stop
   ```
   This creates a local database at `postgresql://postgres:postgres@localhost:54322/postgres`
   Can use Supabase Studio running locally on localhost:54323 to see your DB updates and test

4. **Configure Environment Variables**
   Create `backend/.env` file:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
   DIRECT_URL="postgresql://postgres:postgres@localhost:54322/postgres"
   ```
   Will be replaced with production DB URL when ready

   **For DB Updates:**
   ```bash
   cd backend
   npx prisma db push
   npx prisma generate
   ```

## Notes

Backend uses PostgreSQL/Supabase, Prisma ORM, Firebase Auth, Stripe, SendGrid, and AWS S3. Before each push, run `npm run format` on both frontend and backend directories for code consistency for all devs

**Documentation Links For Reference:**
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Stripe API Docs](https://stripe.com/docs/api)
- [SendGrid API Docs](https://docs.sendgrid.com/)
- [Docker Desktop Docs](https://docs.docker.com/desktop/)