# 🏥 Hospital Appointment System

A full-stack web application for managing hospital appointments. Patients can book/cancel appointments with doctors, and users can register as either patient or doctor. Built with the **MERN stack** (MongoDB, Express, React, Node.js).

## ✨ Features

- **User Registration** – Sign up as a **Patient** or **Doctor** (doctors can optionally add their specialty).
- **Authentication** – Login with username & password, secure JWT-based sessions.
- **View All Users** – See a list of registered patients and doctors in the system.
- **Book Appointment** – Patients can book an appointment with any available doctor (date/time stored).
- **Cancel Appointment** – Patients can cancel their upcoming appointments.
- **Get Appointments** – Fetch all booked appointments (filtered by patient/doctor role).
- **RESTful API** – Well-structured endpoints for user & appointment management.

## 🛠️ Tech Stack

| Layer       | Technology                               |
|-------------|------------------------------------------|
| Frontend    | React (Hooks, Axios, React Router DOM)   |
| Backend     | Node.js, Express.js                      |
| Database    | MongoDB (Mongoose ODM)                   |
| Auth        | JSON Web Tokens (JWT), bcryptjs          |
| Styling     | CSS        |                             |



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
