# Hospital Appointment System

Simple hospital appointment app with a React/Vite frontend and an Express/MongoDB backend.

## Requirements

- Node.js 18+ recommended
- MongoDB database or connection string
- Gmail app password for OTP email verification

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

```bash
cd ../backend
npm install
```

### 2. Configure environment variables

Create a `backend/.env` file with values like:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GMAIL_USER=yourgmailaddress@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM_NAME=Hospital App
EMAIL_FROM=yourgmailaddress@gmail.com
```

## Run the app

### Backend

```bash
cd backend
node server.js
```

### Frontend

```bash
cd frontend
npm run dev
```

The frontend usually runs at `http://localhost:5173`.

## Build frontend

```bash
cd frontend
npm run build
```

## API notes

- Auth routes: `/api/auth/*`
- User routes: `/api/users/*`
- Appointment routes: `/api/appointments/*`

## Postman

Import this collection:

`backend/Hospital.postman_collection.json`
