# Scalability & Architecture Note 📈

This system was designed with **scalability** as a primary requirement. Here’s how the architecture supports growth from a single user to thousands of concurrent requests.

## 1. Stateless Authentication (JWT)
We use **JSON Web Tokens (JWT)** for authentication.
-   **Why?** Unlike session-based auth, JWTs are stateless. The server doesn't need to store session data in memory or a database.
-   **Scalability Impact**: This allows us to horizontally scale the backend (add more servers/instances) without worrying about "sticky sessions." Any server can verify the token signature.

## 2. Rate Limiting & Security
We implemented `express-rate-limit` at the application level.
-   **Why?** To prevent abuse, brute-force attacks, and DDOS attempts.
-   **Scalability Impact**: Ensures that one bad actor cannot overwhelm the system, reserving resources for legitimate users. For a distributed setup (e.g., Kubernetes), we would move this rate limiting to a shared store like **Redis**.

## 3. Database Indexing & Optimization
The MongoDB schemas (`User`, `Task`) are designed with querying patterns in mind.
-   **Optimization**: Fields like `email` are unique and indexed for fast lookups during login.
-   **Future Growth**: The schema relies on referencing (e.g., `Task` references `User`), which keeps documents small. As data grows, this supports sharding strategies effectively.

## 4. Modular MVC Structure
The codebase follows a strict **Model-View-Controller** pattern.
-   **Why?** separation of concerns.
-   **Scalability Impact**:
    -   **Codebase scaling**: Multiple developers can work on different modules (Auth vs Tasks) without conflicts.
    -   **Microservices transition**: The distinct `controllers` and `routes` makes it easy to peel off a usage domain (e.g., "Task Service") into its own microservice in the future.

## 5. Deployment Readiness (Docker)
Although this is a basic submission, the app is "Twelve-Factor App" compliant.
-   Configuration is isolated in `.env`.
-   Logging is handled via `morgan` (stdout).
-   This makes it trivial to containerize with **Docker** and orchestrate with **Kubernetes** or deploy to platforms like AWS ECS or Render.

## 🚀 Next Steps for Massive Scale
If we needed to handle millions of users, the next immediate steps would be:
1.  **Redis Caching**: Cache frequent `GET /tasks` responses to reduce DB load.
2.  **Load Balancing**: Run multiple instances of the Node.js server behind NGINX.
3.  **Horizontal Sharding**: Shard the MongoDB database based on `UserId`.
