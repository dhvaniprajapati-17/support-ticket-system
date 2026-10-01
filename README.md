# Mini Support Ticket System

A small full-stack support ticket application: create, view, edit, search, and resolve support tickets, with a dashboard summary.

It is a learning/demo project that shows how an **Angular** frontend and a **Java Spring Boot** REST API work together, using a clean, conventional structure on both sides.

| Frontend | Backend |
|---|---|
| Angular 22 (standalone components, Signals, Reactive Forms) | Java 25, Spring Boot 4.1.1 |
| TypeScript, RxJS, HttpClient | Spring Web MVC, Spring Data JPA / Hibernate, Bean Validation |
| Plain CSS, Vitest | PostgreSQL, Maven |

---

## Features

- **Dashboard** with total, open, in-progress, and resolved ticket counts
- **Ticket list** with ID, title, priority, status, creator, creation time, and View/Edit actions
- **Search** by title or description (case-insensitive), plus **status** and **priority** filters and a "Clear filters" action
- **Create**, **view**, **edit**, and **delete** tickets (delete asks for confirmation)
- **Change ticket status** from the details page
- **Client-side validation** on the create/edit form, mirroring the backend rules
- **Backend validation** with field-level error messages shown next to the matching form fields
- **Friendly error handling**: not-found pages, safe messages for server errors, and a clear message when the backend is unreachable
- **Reusable status and priority badges** (e.g. `IN_PROGRESS` is shown as "In Progress")
- **Basic, lightweight styling** with plain CSS; the dashboard cards and filter bar wrap on narrower screens
- **Sample data**: 8 tickets are loaded automatically the first time the backend starts with an empty database

---

## Architecture

```
Browser (Angular app, http://localhost:4200)
   │  HTTP  /api/...          (relative URLs)
   ▼
Angular dev proxy             forwards /api → http://localhost:8080
   ▼
TicketController              HTTP layer: routes, JSON, @Valid, status codes
   ▼
TicketService                 business logic, transactions, not-found checks
   ▼
TicketRepository              Spring Data JPA interface (generated implementation)
   ▼
JPA / Hibernate               maps the Ticket entity to the tickets table
   ▼
PostgreSQL                    jdbc:postgresql://localhost:5432/tickets
```

**Frontend**

- Built entirely with **standalone components** (no NgModules).
- **`TicketService`** is the only place that makes HTTP calls; pages call its methods.
- **Reactive Forms** power the create/edit form, which is one shared component (`TicketForm`) used by both pages.
- **Signals** hold page/component state (loading, errors, loaded data).
- **RxJS Observables** are used for HTTP calls and for the ticket-list filter stream (`debounceTime` + `switchMap`).

**Backend**

- **DTOs** (Java records) are used between the API and the entity layer; the JPA entity is never exposed directly.
- **Bean Validation** (`@NotBlank`, `@Size`, `@NotNull`) validates request bodies.
- A **global exception handler** (`@RestControllerAdvice`) turns errors into Spring **ProblemDetail** (RFC 9457) responses.

---

## Project Structure

```
support-ticket-system/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/      StatusBadge, PriorityBadge, TicketForm (shared create/edit form)
│   │   │   ├── models/          TypeScript interfaces matching the backend DTOs
│   │   │   ├── pages/           dashboard, ticket-list, ticket-detail, ticket-create, ticket-edit, not-found
│   │   │   ├── services/        TicketService (all HTTP calls)
│   │   │   ├── shared/          API error helpers, enum label pipe
│   │   │   ├── testing/         shared test helpers
│   │   │   ├── app.config.ts    providers (router, HttpClient)
│   │   │   └── app.routes.ts    route definitions
│   │   └── styles.css           shared styles
│   ├── proxy.conf.json          dev proxy: /api → http://localhost:8080
│   ├── angular.json
│   └── package.json
├── backend/
│   ├── src/main/java/com/dhvaniprajapati/tickets/
│   │   ├── controller/          TicketController
│   │   ├── dto/                 request/response records, TicketMapper
│   │   ├── entity/              Ticket, Priority, Status
│   │   ├── exception/           GlobalExceptionHandler, TicketNotFoundException
│   │   ├── repository/          TicketRepository
│   │   └── service/             TicketService
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── data.sql             sample tickets (inserted only when the table is empty)
│   ├── src/test/java/...        controller, service, repository, and startup tests
│   ├── pom.xml
│   └── mvnw                     Maven wrapper
└── README.md
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Java (JDK) | **25** | Required by `pom.xml`. Check with `java -version`. |
| Node.js | **22.22.3+**, **24.15.0+**, or **26+** | Required by Angular 22. Check with `node -v`. |
| npm | Comes with Node.js | Used to install and run the frontend. |
| PostgreSQL | Any recent version (verified with 18) | Must be running locally with a `tickets` database; see [Database Setup](#database-setup-postgresql). |
| Maven | Not required | The included wrapper (`./mvnw`) downloads Maven automatically. |
| Angular CLI | Not required globally | It is installed locally by `npm install` and used through the npm scripts. |

```bash
git clone https://github.com/dhvaniprajapati-17/support-ticket-system.git
cd support-ticket-system
```

---

## Database Setup (PostgreSQL)

The backend stores tickets in a local **PostgreSQL** database. H2 is no longer used by the application (it is only used internally by the automated tests, see [Running Tests](#running-tests)), so the H2 console is gone; use `psql` or any PostgreSQL client instead.

**1. Make sure PostgreSQL is running** on port 5432:

```bash
pg_isready -h localhost -p 5432      # expected: "localhost:5432 - accepting connections"
```

**2. Create the database** (once). The default configuration connects as the PostgreSQL user `dhvaniprajapati` (the project author's local user) to a database named `tickets`:

```bash
createdb -h localhost -p 5432 -U dhvaniprajapati --owner=dhvaniprajapati tickets
```

If you use a different PostgreSQL user, create the database with that user instead and set `DB_USERNAME` (see step 3).

Only the database has to exist; the backend creates the `tickets` **table** itself on first start.

**3. Configure the connection** with environment variables if your setup differs from the defaults:

| Variable | Default | Meaning |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `tickets` | Database name |
| `DB_USERNAME` | `dhvaniprajapati` | Database user |
| `DB_PASSWORD` | *(empty)* | Password; leave unset if your local PostgreSQL does not require one |

For example, to connect with your own PostgreSQL user and a password:

```bash
export DB_USERNAME=myuser
export DB_PASSWORD='my-password'
```

The password is never stored in the repository.

---

## Running the Backend

```bash
cd backend
./mvnw test              # optional: run the backend tests (no PostgreSQL needed)
./mvnw spring-boot:run   # start the API (PostgreSQL must be running)
```

- API: **http://localhost:8080** (endpoints under `/api/tickets`)
- On startup, Hibernate creates the `tickets` table if it does not exist (`spring.jpa.hibernate.ddl-auto=update`) and keeps existing data. If the table is empty, the 8 sample tickets from `data.sql` are inserted.

**Verify the connection:**

```bash
curl http://localhost:8080/api/tickets/summary
# first start: {"total":8,"open":4,"inProgress":2,"resolved":2}

psql -h localhost -U dhvaniprajapati -d tickets -c "SELECT id, title, status FROM tickets ORDER BY id;"
```

> **Note:** Data is stored in PostgreSQL, so tickets you create, edit, or delete **persist across backend restarts**. The sample tickets are only inserted while the table is empty; to start over, delete the rows (`psql -h localhost -U dhvaniprajapati -d tickets -c "TRUNCATE tickets RESTART IDENTITY;"`) and restart the backend.

---

## Running the Frontend

Start the backend first, then in a second terminal:

```bash
cd frontend
npm install
npm start
```

- App: **http://localhost:4200**
- The Angular dev server forwards every `/api` request to the Spring Boot server (see `frontend/proxy.conf.json`). Because of this proxy, the application code uses **relative `/api/...` URLs** and never references `localhost:8080` directly, and no CORS configuration is needed.

---

## Running Tests

| Suite | Command | Tests |
|---|---|---|
| Backend (JUnit 5, Mockito, MockMvc, `@DataJpaTest`) | `cd backend && ./mvnw test` | 26 |
| Frontend (Vitest + Angular TestBed) | `cd frontend && npm test -- --watch=false` | 44 |

The backend tests do **not** need PostgreSQL: service and controller tests use no database, and the repository and startup tests replace the PostgreSQL connection with a temporary in-memory H2 database (`@DataJpaTest`, `@AutoConfigureTestDatabase`). The real PostgreSQL setup is verified by running the application (see [Running the Backend](#running-the-backend)).

`npm test` on its own starts Vitest in **watch mode** when run in a terminal (re-running tests on file changes); `--watch=false` runs the suite once and exits.

Production build of the frontend:

```bash
cd frontend
npm run build            # output: frontend/dist/support-tickets
```

---

## API Reference

Base path: `/api/tickets`. All request and response bodies are JSON.

| Method | Path | Purpose | Success |
|---|---|---|---|
| `GET` | `/api/tickets` | List tickets (optional filters) | `200` |
| `GET` | `/api/tickets/{id}` | Get one ticket | `200` |
| `POST` | `/api/tickets` | Create a ticket | `201` + `Location` header |
| `PUT` | `/api/tickets/{id}` | Update a ticket's editable fields | `200` |
| `PATCH` | `/api/tickets/{id}/status` | Change only the status | `200` |
| `DELETE` | `/api/tickets/{id}` | Delete a ticket | `204` (no body) |
| `GET` | `/api/tickets/summary` | Dashboard counts | `200` |

### Ticket

```json
{
  "id": 1,
  "title": "Cannot log in to customer portal",
  "description": "Users report \"invalid session\" errors after entering correct credentials since this morning.",
  "priority": "HIGH",
  "status": "OPEN",
  "createdBy": "alice",
  "createdAt": "2026-09-22T12:16:58.132262Z",
  "updatedAt": "2026-09-22T12:16:58.132262Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | number | Generated by the database |
| `title` | string | |
| `description` | string | |
| `priority` | enum | `LOW`, `MEDIUM`, `HIGH` |
| `status` | enum | `OPEN`, `IN_PROGRESS`, `RESOLVED` |
| `createdBy` | string | Free-text name entered when the ticket is created (there is no authentication); cannot be changed afterwards |
| `createdAt` | string | ISO-8601 UTC timestamp, set by the server |
| `updatedAt` | string | ISO-8601 UTC timestamp, set by the server on every change |

### `GET /api/tickets`

All query parameters are optional and can be combined. Results are ordered newest first.

| Parameter | Example | Meaning |
|---|---|---|
| `status` | `OPEN` | Only tickets with this status |
| `priority` | `HIGH` | Only tickets with this priority |
| `search` | `portal` | Case-insensitive text match in the title **or** description |

```bash
curl "http://localhost:8080/api/tickets?status=OPEN&priority=HIGH&search=portal"
```

Returns an array of tickets.

### `GET /api/tickets/{id}`

Returns one ticket, or `404` if it does not exist.

### `POST /api/tickets`

```json
{
  "title": "VPN disconnects",
  "description": "Remote users lose VPN every 10 minutes.",
  "priority": "HIGH",
  "createdBy": "alice"
}
```

`status` is optional and defaults to `OPEN`. Returns `201 Created` with the new ticket and a `Location` header pointing to it (e.g. `http://localhost:8080/api/tickets/9`).

### `PUT /api/tickets/{id}`

Replaces the editable fields. `createdBy`, `id`, and the timestamps cannot be changed.

```json
{
  "title": "VPN disconnects",
  "description": "Remote users lose VPN every 10 minutes.",
  "priority": "MEDIUM",
  "status": "IN_PROGRESS"
}
```

Returns the updated ticket.

### `PATCH /api/tickets/{id}/status`

```json
{ "status": "RESOLVED" }
```

Returns the updated ticket.

### `DELETE /api/tickets/{id}`

Returns `204 No Content`, or `404` if the ticket does not exist.

### `GET /api/tickets/summary`

```json
{ "total": 8, "open": 4, "inProgress": 2, "resolved": 2 }
```

### Validation rules

| Field | Rule | Applies to |
|---|---|---|
| `title` | Required (not blank), 3–100 characters | `POST`, `PUT` |
| `description` | Required (not blank), max 2000 characters | `POST`, `PUT` |
| `priority` | Required; `LOW`, `MEDIUM`, or `HIGH` | `POST`, `PUT` |
| `createdBy` | Required (not blank), max 100 characters | `POST` only |
| `status` | `OPEN`, `IN_PROGRESS`, or `RESOLVED`; optional on `POST`, required on `PUT` and `PATCH` | `POST`, `PUT`, `PATCH` |

Unknown enum values (for example `"status": "DONE"` or `?priority=URGENT`) are rejected with `400` and a message listing the allowed values.

---

## Error Handling

The backend returns errors as Spring **ProblemDetail** responses (RFC 9457, content type `application/problem+json`). Validation errors include an `errors` object with one message per field:

```json
{
  "title": "Validation failed",
  "status": 400,
  "detail": "One or more fields are invalid.",
  "instance": "/api/tickets",
  "errors": {
    "createdBy": "must not be blank",
    "description": "must not be blank",
    "title": "size must be between 3 and 100"
  }
}
```

| Situation | Status | What the Angular app shows |
|---|---|---|
| Validation error | `400` | Each message under the matching form field, plus the `detail` summary |
| Other client error (e.g. invalid value) | `400` | The ProblemDetail `detail` message |
| Ticket not found | `404` | A "Ticket not found" message with a link back to the list |
| Unexpected server error | `5xx` | "Something went wrong on the server. Please try again." (no server details) |
| Backend not reachable | no response / proxy `502`–`504` | "Cannot reach the server. Please check that the backend is running." |

---

## Angular Routes

| Route | Page |
|---|---|
| `/` | Dashboard |
| `/tickets` | Ticket list with search and filters |
| `/tickets/new` | Create ticket |
| `/tickets/:id` | Ticket details (status change, edit, delete) |
| `/tickets/:id/edit` | Edit ticket |

Any other URL shows the **not-found** page.

---

## Testing and Verification

- **Backend: 26 automated tests** — API contract tests for every endpoint and error response (`@WebMvcTest` + MockMvc), service unit tests (Mockito), repository tests for the search query (`@DataJpaTest`), and an application startup test; the repository and startup tests run on an in-memory H2 test database.
- **Frontend: 44 automated tests** — dashboard, ticket list (including debounced search sending a single request), create/edit form validation and backend error mapping, ticket details (status change, delete), routing, `TicketService`, and the error helpers. HTTP calls are checked with Angular's `HttpTestingController`.
- **Production build** of the frontend completes successfully.
- **Real PostgreSQL check**: the running backend was verified against a local PostgreSQL database (schema creation, sample data, create/read/update/status/delete, and data persisting across a restart).
- **Browser walkthrough** against the running backend: dashboard, list, search, both filters, view, status change, edit, create, delete, and the error messages above.

---

## Current Limitations

These are deliberate simplifications for a demo project:

- Search and filter values are not stored in the URL, so they reset on page reload.
- There is no pagination; the list shows all tickets.
- The database schema is managed by Hibernate (`ddl-auto=update`) rather than a migration tool such as Flyway.
- PostgreSQL must be installed and running locally (no container setup is provided).
- The automated repository tests run on in-memory H2, so PostgreSQL-specific behavior is verified by running the application against PostgreSQL rather than by the test suite.
- There is no authentication or authorization; `createdBy` is a free-text field.
- The edit form changes title, description, and priority; status is changed separately on the details page.
- Styling is intentionally basic.

---

## What This Project Demonstrates

**Angular**

- Standalone components and routing (including route parameters as component inputs)
- Dependency injection and services
- `HttpClient` with Observables
- Signals for component state
- Reactive Forms with built-in and custom validators
- Reusable components with `input()` / `output()` communication
- RxJS `debounceTime` and `switchMap` for search
- Component and service testing with TestBed and `HttpTestingController`

**Spring Boot**

- REST controllers
- Service and repository layers
- JPA / Hibernate entities and Spring Data repositories
- DTOs and mapping
- Bean Validation
- Global exception handling with ProblemDetail
- PostgreSQL with environment-based configuration and idempotent seed data
- Replacing the real database with an in-memory one in tests (`@DataJpaTest`, `@AutoConfigureTestDatabase`)
- Testing with `@WebMvcTest`, `@DataJpaTest`, Mockito, and `@SpringBootTest`

---

## Future Improvements

Ideas only — **not implemented**:

- Keep search/filter values in URL query parameters
- Pagination for the ticket list
- Authentication and authorization
- Database migrations with Flyway or Liquibase
- Production deployment setup
- A more polished UI
