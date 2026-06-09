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
| Styling     | CSS        |
