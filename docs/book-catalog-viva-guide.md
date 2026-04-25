# Book Catalog Service Viva Guide

This note is written as if you are starting from zero. Read this first before the viva and practice saying the answers out loud.

## 1. What is this project?

UniLib is a microservices-based library management system.

Main parts of the system:

- `frontend`: the web UI used by students, staff, and admins
- `api-gateway`: the single entry point for browser requests
- `user-service`: handles registration, login, profiles, and roles
- `book-catalog-service`: handles book records and availability
- `loan-service`: handles borrowing and returning books
- `notification-service`: handles notifications
- `mongo`: database used by the services

Simple flow:

1. User opens the frontend.
2. Frontend sends requests to the API Gateway.
3. API Gateway forwards the request to the correct microservice.
4. Each service handles its own business logic and database operations.

## 2. What is my component?

Your component is the `book-catalog-service`.

Its job is to manage the library book collection:

- store book details
- list books
- search books
- return a single book by ID
- add new books
- update existing books
- delete books
- update availability when borrowing/returning happens

In short:

`book-catalog-service` is the service responsible for all book data.

## 3. Why do we need a separate Book Catalog Service?

We separate it because of microservice architecture.

Reasons:

- each service has one clear responsibility
- it is easier to develop and maintain
- changes to book logic do not heavily affect user or notification logic
- services can scale independently
- bugs are easier to isolate

Good viva line:

`We kept book management as a separate microservice so the system follows separation of concerns. This makes the application easier to maintain, scale, and test.`

## 4. Technologies used in this service

The `book-catalog-service` uses:

- `Node.js`: JavaScript runtime
- `Express.js`: backend web framework
- `MongoDB`: database
- `Mongoose`: ODM used to work with MongoDB
- `express-validator`: validates request data
- `jsonwebtoken`: verifies JWT tokens
- `helmet`: adds security-related HTTP headers
- `cors`: controls which frontend origins can access the service
- `express-rate-limit`: limits repeated requests

## 5. Where is the code for this component?

Important files:

- `services/book-catalog-service/src/index.js`
- `services/book-catalog-service/src/routes/bookRoutes.js`
- `services/book-catalog-service/src/models/Book.js`
- `services/book-catalog-service/src/config/db.js`
- `services/book-catalog-service/src/middleware/auth.js`

What each file does:

- `index.js`: starts the Express app and applies middleware
- `bookRoutes.js`: contains the API endpoints
- `Book.js`: defines the MongoDB schema for a book
- `db.js`: connects to MongoDB
- `auth.js`: verifies JWT token and admin authorization

## 6. Data model of a book

The `Book` model contains:

- `title`
- `author`
- `isbn`
- `category`
- `description`
- `totalCopies`
- `availableCopies`
- `publishedYear`
- `createdAt`

Important rules:

- `title`, `author`, `isbn`, and `category` are required
- `isbn` must be unique
- `totalCopies` defaults to `1`
- `availableCopies` defaults to `1`

Good viva line:

`The Book schema stores both bibliographic details and inventory details. We separately track total copies and available copies so the system can support borrowing operations.`

## 7. Main API endpoints in Book Catalog Service

### Public endpoints

- `GET /api/books`
  - get all books
  - supports search and category filtering
- `GET /api/books/:id`
  - get one book by ID

### Protected admin/staff management endpoints

- `POST /api/books`
  - add a new book
  - requires JWT authentication and admin authorization in this service
- `PUT /api/books/:id`
  - update a book
  - requires JWT authentication and admin authorization
- `DELETE /api/books/:id`
  - delete a book
  - requires JWT authentication and admin authorization

### Availability update endpoint

- `PATCH /api/books/:id/availability`
  - updates `availableCopies`
  - used when a book is borrowed or returned

## 8. How search works

The `GET /api/books` endpoint accepts:

- `search`
- `category`

Search checks these fields using case-insensitive regex:

- `title`
- `author`
- `isbn`

Example:

- searching `harry` can match a title or author containing `harry`

Good viva line:

`Search is implemented in the route layer by building a MongoDB filter. We use case-insensitive regex on title, author, and ISBN.`

## 9. How add/update validation works

Before inserting or updating a book, the service validates input.

Examples:

- title cannot be empty
- author cannot be empty
- category cannot be empty
- ISBN cannot be empty
- `totalCopies` must be at least `1`
- `availableCopies` cannot be negative
- `availableCopies` cannot be greater than `totalCopies`
- `publishedYear` must be a valid year

There is also duplicate ISBN checking.

Why this matters:

- prevents bad data
- protects data consistency
- avoids impossible inventory states

## 10. Authentication and authorization

The service uses JWT-based authentication.

How it works:

1. User logs in through the `user-service`.
2. A JWT token is issued.
3. The frontend stores the token.
4. Protected requests send `Authorization: Bearer <token>`.
5. The service verifies the token using `JWT_SECRET`.

Authorization logic:

- authenticated user is checked by `auth`
- admin access is checked by `adminOnly`

Current behavior in code:

- only admins can add, update, and delete books in the service itself
- the frontend allows `staff` and `admin` to open the manage books page

Important viva point:

There is a small mismatch here.

- frontend allows `staff` and `admin`
- backend route middleware currently allows only `admin`

Good answer if asked:

`At the UI level, staff and admin can access the manage-books page, but in the current backend implementation the book-management endpoints are restricted to admin only. If needed, this can be aligned by updating the authorization middleware or role policy.`

## 11. How this service interacts with other services

The Book Catalog Service does not work alone.

Main interaction:

- `loan-service` calls it to check a book before borrowing
- `loan-service` calls it again to reduce `availableCopies` after a borrow
- when a book is returned, `loan-service` increases `availableCopies`

Borrow flow:

1. User requests to borrow a book.
2. `loan-service` asks `book-catalog-service` for that book.
3. If `availableCopies > 0`, loan is created.
4. `loan-service` calls the availability endpoint.
5. `availableCopies` is reduced by 1.

Return flow:

1. Staff/admin processes a return.
2. `loan-service` gets the book details.
3. `loan-service` increases `availableCopies`.

Why this is important:

- the book service is the source of truth for inventory
- the loan service is the source of truth for borrowing records

## 12. API Gateway role

The browser does not directly call each microservice.

Instead:

- browser calls `api-gateway`
- gateway forwards:
  - `/api/books` to `book-catalog-service`
  - `/api/users` to `user-service`
  - `/api/loans` to `loan-service`
  - `/api/notifications` to `notification-service`

Benefits of API Gateway:

- single entry point
- easier routing
- centralized security controls
- easier CORS handling
- hides internal service addresses from the client

Good viva line:

`The API Gateway acts as the front door of the system. The frontend only knows the gateway, while internal microservice addresses remain hidden inside the deployment network.`

## 13. Database design

This project uses MongoDB.

In Docker Compose, each service uses its own logical database:

- `unilib-users`
- `unilib-books`
- `unilib-loans`
- `unilib-notifications`

Why this is good:

- better service separation
- lower coupling
- each service owns its own data

For your component:

- the Book Catalog Service connects to `unilib-books`

## 14. Security features implemented

Security is not just login. This project applies multiple layers of security.

### In the book service itself

- `helmet` for safer HTTP headers
- `cors` to restrict allowed origins
- `express-rate-limit` to reduce abuse
- `express.json({ limit: "10kb" })` to prevent oversized payloads
- JWT verification for protected routes
- admin authorization for management actions
- input validation using `express-validator`

### At system level

- only `frontend` and `api-gateway` expose ports to the host in Docker
- backend services stay on an internal network
- containers use hardened settings:
  - read-only filesystem
  - dropped Linux capabilities
  - `no-new-privileges`
- secrets are meant to stay in environment variables
- CI supports `npm audit`, SonarCloud, and Snyk

Good viva line:

`We applied defense in depth. Security exists at multiple layers: container level, network level, HTTP level, authentication level, authorization level, and CI scanning level.`

## 15. Deployment explanation

### Local deployment

For local development, the project uses Docker Compose.

Main idea:

- each microservice runs in its own container
- MongoDB runs in its own container
- frontend runs in its own container
- API Gateway connects everything

Why Docker Compose is useful:

- easy to run the full system
- same environment for all team members
- fewer machine-specific issues

### Cloud deployment

The repo includes Azure deployment support in `infra/azure`.

Planned Azure approach:

- deploy services as Azure Container Apps
- keep internal services private
- expose only frontend and API Gateway publicly
- store secrets securely as Container App secrets
- use a cloud MongoDB connection string

Good viva line:

`For deployment, we containerized the services and used Docker Compose locally. For cloud deployment, the repo includes Azure Container Apps support because it suits microservices well and allows separate internal and external services.`

## 16. Why containerization is important

Containerization means packaging the application with its dependencies.

Benefits:

- same behavior across machines
- easy deployment
- isolation between services
- faster onboarding
- supports microservice architecture well

## 17. CI/CD and DevSecOps

CI/CD means:

- `CI`: Continuous Integration
- `CD`: Continuous Delivery or Continuous Deployment

In this project:

- GitHub Actions can run security checks
- `npm audit` checks dependencies for vulnerabilities
- SonarCloud can do static code analysis
- Snyk can scan code and dependencies

Why this matters:

- problems are caught early
- safer deployments
- better code quality

Simple viva line:

`We use DevSecOps ideas by including security checks in the pipeline instead of treating security as a final step only.`

## 18. Health checks and reliability

The service provides:

- `GET /health`

This helps us know whether the service is alive.

The gateway also has:

- `GET /health`
- `GET /health/services`

Why health checks matter:

- monitoring
- deployment verification
- quick debugging

## 19. Likely viva questions and simple answers

### Q: What is the responsibility of the Book Catalog Service?

It manages all book-related information such as title, author, category, ISBN, and copy availability.

### Q: Why track both `totalCopies` and `availableCopies`?

`totalCopies` is the total physical inventory, while `availableCopies` shows how many can currently be borrowed.

### Q: Why use MongoDB?

MongoDB is flexible, easy to use with JSON-style documents, and fits well with Node.js and microservice development.

### Q: Why use Mongoose?

Mongoose helps define schemas, apply validation, and interact with MongoDB in a structured way.

### Q: Why use an API Gateway?

It gives one entry point to the client, simplifies routing, centralizes some security controls, and hides internal services.

### Q: What happens when a user borrows a book?

The loan service checks the selected book through the book service, creates the loan if a copy is available, then updates `availableCopies`.

### Q: How do you prevent duplicate books?

The service checks whether the ISBN already exists before creating a new record, and the schema also marks ISBN as unique.

### Q: What validation is done?

Required fields are checked, numeric fields are validated, published year is validated, and available copies cannot exceed total copies.

### Q: What security mechanisms are used?

JWT authentication, role-based authorization, Helmet, rate limiting, CORS restriction, request size limits, container hardening, internal networking, and security scanning.

### Q: How is deployment handled?

Locally with Docker Compose, and for cloud deployment the repo includes Azure Container Apps support.

## 20. Honest limitations you can mention in viva

Do not be afraid to mention improvements. That often sounds mature in a viva.

### Limitation 1

The availability update route in the book service is intended for service-to-service use, but in the current code it does not use dedicated internal-service authentication middleware.

Safe way to say it:

`One improvement would be to protect the availability update endpoint with internal service authentication, similar to the internal token approach used in other services.`

### Limitation 2

There is a role mismatch between frontend and backend for managing books.

Safe way to say it:

`The frontend currently allows staff and admin into the manage-books page, while the backend only authorizes admin for create, update, and delete. This should be aligned for consistency.`

### Limitation 3

There are no visible automated unit/integration tests in this service.

Safe way to say it:

`The current focus is working functionality and deployment, but adding automated tests for routes, validation, and service interactions would improve reliability.`

## 21. Very short 1-minute viva answer

`My component is the Book Catalog Service in the UniLib microservices system. It is responsible for managing book records such as title, author, ISBN, category, and copy availability. It provides APIs to list books, search books, get a book by ID, and for authorized users to add, update, and delete books. It is built with Node.js, Express, MongoDB, and Mongoose. The service also supports the loan workflow by letting the loan service check and update availability when books are borrowed or returned. Security-wise, it uses JWT-based authentication for protected routes, admin authorization, Helmet, CORS restriction, rate limiting, and request validation. In deployment, it runs as a Docker container and is accessed through the API Gateway.`

## 22. Very short 30-second answer

`The Book Catalog Service manages all book data in the system. It stores book details, supports search, and keeps track of available copies. Other services, especially the loan service, depend on it to know whether a book can be borrowed.`

## 23. How to study this quickly

Read in this order:

1. Section 2: what your component does
2. Section 7: endpoints
3. Section 11: interaction with loan service
4. Section 14: security
5. Section 15: deployment
6. Section 19: viva questions
7. Section 21 and 22: practice answers

## 24. Final memory tips

Remember these 5 key points:

1. `book-catalog-service` manages book data and availability.
2. It is built with Express + MongoDB + Mongoose.
3. Public users can view/search books, but management routes are protected.
4. `loan-service` depends on it during borrow/return operations.
5. Deployment uses Docker, and security includes JWT, Helmet, rate limiting, CORS, and internal networking.

If you forget everything in the viva, say this:

`My service is responsible for managing books and their availability. It exposes APIs for viewing and managing books, stores data in MongoDB, and works with the loan service when borrowing and returning books.`
