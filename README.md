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

## PostgreSQL Setup (Required for Backend)
PostgreSQL must be running locally for the backend to work.

Install and start PostgreSQL:
- **On macOS**: `brew install postgresql && brew services start postgresql`
- **On Linux**: `sudo apt-get install postgresql && sudo service postgresql start`
- **On Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

Create database and set up Prisma:
```bash
createdb tcba_db
cd backend
npx prisma migrate dev
npx prisma generate
```

The backend connects to localhost:5432 by default.

## Notes

Backend uses PostgreSQL, Prisma ORM, Firebase Auth, Stripe, SendGrid, and AWS S3. Before each push, run `npm run format` on both frontend and backend directories for code consistency for all devs

**Documentation Links For Reference:**
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Stripe API Docs](https://stripe.com/docs/api)
- [SendGrid API Docs](https://docs.sendgrid.com/)