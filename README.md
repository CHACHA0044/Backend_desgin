# Scalable Backend System 🚀

Hey! This is the submission for the **Backend Developer Intern** task. It's a robust, production-ready backend system built with **Node.js, Express, and MongoDB**, paired with a sleek **React** frontend.

I focused heavily on security, modularity, and scalability—making sure the code isn't just "working" but is ready for real-world traffic.

## 🌟 Key Features

### Backend (The Core)
-   **Authentication**: Secure JWT-based auth with `access` and `refresh` token flow (conceptually prepared, using JWT for now). Passwords are hashed using `bcryptjs`.
-   **Role-Based Access Control (RBAC)**: Distinct permissions for `UserId` vs `Admin`.
-   **Security First**:
    -   `helmet` for secure HTTP headers.
    -   `express-rate-limit` to prevent brute-force attacks.
    -   `xss-clean` & `express-mongo-sanitize` to block injection attacks.
-   **Scalable Structure**: MVC pattern (Models, Views/Routes, Controllers) ensures code is organized and easy to extend.
-   **API Documentation**: Full Swagger UI available at `/api-docs`.

### Frontend (The UI)
-   **Modern Tech**: Built with **React** + **Vite** + **Framer Motion** for smooth animations.
-   **Auth Flow**: Login, Register, and Logout pages connected to the backend.
-   **Dashboard**: A protected route that strictly requires a valid token to access.
-   **Navigation**: Custom animated navigation menu.

---

## 🛠️ Tech Stack

-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB (Mongoose)
-   **Frontend**: React.js, TailwindCSS, GSAP, Framer Motion
-   **Docs**: Swagger (OpenAPI 3.0)

---

## 🏁 Getting Started

Follow these steps to get the project running on your machine.

### 1. Prerequisites
-   Node.js (v18+ recommended)
-   MongoDB (Local or Atlas URI)

### 2. Backend Setup
```bash
# Install dependencies
npm install

# Create a .env file in the root directory
# (See .env.example if available, or use the keys below)
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=super_secret_key_change_this
NODE_ENV=development

# Start the server
npm run dev
```
The server will start at `http://localhost:5000`.
**API Docs:** Visit `http://localhost:5000/api-docs` to interact with the API.

### 3. Frontend Setup
```bash
cd Client

# Install dependencies
npm install

# Start the dev server
npm run dev
```
 The UI will launch at `http://localhost:5173`.

---

## 📂 Project Structure

```
├── config/             # DB configurations
├── controllers/        # Business logic (Auth, Tasks)
├── middleware/         # Auth checks, Error handling, Rate limiting
├── models/             # Mongoose schemas
├── routes/             # API route definitions
├── Client/             # React Frontend
├── app.js              # Express app setup (Middleware, Swagger)
└── server.js           # Server entry point
```

## 🧪 Testing
You can test the APIs using:
1.  **Swagger UI**: Go to `/api-docs` on the running backend.
2.  **Postman**: Import the `swagger.yaml` or hit the endpoints directly.
3.  **Frontend**: Use the Login/Register pages to test the full flow.

---

*Ready to scale!* 🚀