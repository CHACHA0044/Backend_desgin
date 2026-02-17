# Scalable Backend System 🚀

A robust, production-ready backend system built with **Node.js, Express, and MongoDB**, paired with a sleek **React** frontend. This project demonstrates a scalable architecture with advanced security features, role-based access control, and a modern, responsive UI.

**👉 Live Demo:** [https://backend-desgin-qpqm.vercel.app/](https://backend-desgin-qpqm.vercel.app/)

## 🌟 Key Features

### Backend Architecture
-   **Security First**: Implements `helmet` for secure headers, `express-rate-limit` for brute-force protection, and sanitization against XSS/Injection attacks.
-   **Authentication**: Secure JWT-based authentication with separate `access` and `refresh` token flows.
-   **RBAC (Role-Based Access Control)**: Granular permissions system distinguishing between Admin and User roles.
-   **Performance**: Redis caching layer for optimized data retrieval.
-   **Scalability**: Modular MVC structure designed for easy extension and maintenance.
-   **Documentation**: Integrated Swagger UI (`/api-docs`) for interactive API testing.

### Frontend Experience
-   **Modern UI/UX**: Built with **React** and **Tailwind CSS**, featuring a glassmorphic design system.
-   **Interactivity**: Smooth animations powered by **Framer Motion** and **GSAP**.
-   **State Management**: Real-time updates for task/order management.
-   **Dashboard**: Protected, role-aware dashboard interfaces for both Admins and Users.

---

## 🛠️ Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose)
-   **Caching**: Redis
-   **Frontend**: React, Vite, TailwindCSS
-   **Animation**: Framer Motion, GSAP
-   **Documentation**: Swagger (OpenAPI 3.0)

---

## 🏁 Getting Started

### 1. Prerequisites
-   Node.js (v18+ recommended)
-   MongoDB (Local or Atlas URI)
-   Redis Server

### 2. Backend Setup
1.  Navigate to the root directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory with the following keys:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    NODE_ENV=development
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The server will run at `http://localhost:5000`.
    **API Docs:** Visit `http://localhost:5000/api-docs`.

### 3. Frontend Setup
1.  Navigate to the `Client` directory:
    ```bash
    cd Client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend server:
    ```bash
    npm run dev
    ```
    The UI will be accessible at `http://localhost:5173`.

---

## 📂 Project Structure

```bash
├── config/             # Database and external service configurations
├── controllers/        # Business logic for Auth, Tasks, and Data
├── middleware/         # Security, Auth verification, and Error handling
├── models/             # Mongoose data schemas
├── routes/             # API route definitions
├── Client/             # React Frontend source code
├── app.js              # Express application setup
└── server.js           # Entry point
```

## 🧪 Testing

-   **Swagger UI**: Interact with endpoints directly at `/api-docs`.
-   **Postman**: Import `swagger.yaml` for comprehensive testing.
-   **Frontend Integration**: Use the application UI to test full user flows (Login -> Dashboard -> Tasks).

---

*Built with scalability and performance in mind.*