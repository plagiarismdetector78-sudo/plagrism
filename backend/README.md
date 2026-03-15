# Interview Platform - Backend

Express.js backend API for the interview platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update the environment variables in `.env` with your database credentials and API keys

4. Run the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Database Scripts

Database utility scripts are located in the `scripts/` folder:
- `add-interviewer-feedback-column.js`
- `add-transcript-column.js`
- `check-db.js`
- `check-interview-data.js`
- `check-users-table.js`
