<div align="center">

# 🏥 Doctor Portal

### Modern Full-Stack Hospital Management System

A production-ready Hospital Management Portal that enables doctors to securely manage patients, appointments, and payments through an intuitive dashboard.

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular)](https://angular.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge)](https://render.com/)
[![GitHub Pages](https://img.shields.io/badge/Frontend-GitHub%20Pages-222222?style=for-the-badge&logo=github)](https://pages.github.com/)

### 🌐 Live Application

**Frontend**
https://gupthamandavilli.github.io/Doctor_Portal/

**Backend API**
https://doctor-portal-backend-6zix.onrender.com/api/health

</div>

---

# 📖 Overview

Doctor Portal is a modern hospital management application developed to streamline doctor workflows by centralizing patient records, appointment tracking, and payment management into one secure platform.

The application follows a **client-server architecture**, where the Angular frontend communicates with a RESTful Express API connected to a cloud-hosted PostgreSQL database.

---

# ✨ Key Features

## 🔐 Authentication

- Secure Doctor Login
- JWT Authentication
- Route Protection using Angular Guards
- Session Persistence
- Logout Support

---

## 👨‍⚕️ Doctor Dashboard

- Personalized Dashboard
- Real-time Statistics
- Patient Overview
- Revenue Summary
- Quick Navigation

---

## 🩺 Patient Management

- Register Patients
- View Patient Records
- Update Patient Details
- Delete Patients
- Search Patients
- Status Filtering
- Appointment Tracking

---

## 💳 Payment Management

- View Payment History
- Update Payment Status
- Revenue Dashboard
- Pending Payment Tracking

---

## ☁ Cloud Deployment

✔ Angular deployed on GitHub Pages

✔ Node.js API deployed on Render

✔ PostgreSQL hosted on Neon

✔ Fully Connected REST Architecture

---

# 🏗 System Architecture

```
                GitHub Pages
                      │
                      │
                      ▼
            Angular 22 Frontend
                      │
        HTTP REST API Requests
                      │
                      ▼
          Express.js Backend (Render)
                      │
             PostgreSQL Driver
                      │
                      ▼
         Neon PostgreSQL Database
```

---

# 🛠 Technology Stack

## Frontend

- Angular 22
- TypeScript
- HTML5
- CSS3
- Tailwind CSS
- RxJS

---

## Backend

- Node.js
- Express.js
- JWT Authentication
- REST APIs

---

## Database

- PostgreSQL
- Neon Cloud Database

---

## Deployment

- GitHub Pages
- Render
- Neon

---

# 📁 Project Structure

```
Doctor_Portal

├── frontend
│
│   ├── src
│   │
│   ├── app
│   │   ├── guards
│   │   ├── pages
│   │   ├── services
│   │   ├── shared
│   │   └── components
│   │
│   └── angular.json
│
├── backend
│
│   ├── middleware
│   ├── routes
│   ├── database
│   ├── controllers
│   ├── index.js
│   └── package.json
│
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/GUPTHAMANDAVILLI/Doctor_Portal.git

cd Doctor_Portal
```

---

## Frontend

```bash
cd frontend

npm install

ng serve
```

Runs on

```
http://localhost:4200
```

---

## Backend

```bash
cd backend

npm install

npm start
```

Runs on

```
http://localhost:5000
```

---

# ⚙ Environment Variables

Backend `.env`

```env
DATABASE_URL=your_neon_database_url
```

---

# 📡 REST API

## Authentication

```
POST /api/auth/login
```

---

## Patients

```
GET      /api/patients

POST     /api/patients

PUT      /api/patients/:id

DELETE   /api/patients/:id
```

---

## Payments

```
GET      /api/payments

PATCH    /api/payments/:id
```

---

# 🔒 Security

- JWT Authentication
- Protected API Routes
- Route Guards
- CORS Configuration
- Environment Variables
- Secure PostgreSQL Connection

---

# 📈 Deployment Pipeline

```
Developer

    │

GitHub Repository

    │

───────────────

Frontend

GitHub Actions

↓

GitHub Pages

───────────────

Backend

Git Push

↓

Render

↓

Neon Database
```

---

# 📸 Application Preview

> Replace these with your screenshots

| Login | Dashboard |


| Patients | Payments |


---

# 🎯 Skills Demonstrated

- Angular Development
- Full Stack Development
- REST API Design
- PostgreSQL
- Authentication
- Cloud Deployment
- Production Deployment
- Responsive UI Design
- CRUD Operations
- Git Version Control

---

# 👨‍💻 Developer

## Guptha Mandavilli

Computer Science Engineer

GitHub

https://github.com/GUPTHAMANDAVILLI

---

<div align="center">

### ⭐ If you found this project useful, consider giving it a Star.

Built with ❤️ using Angular, Node.js and PostgreSQL

</div>
