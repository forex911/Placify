# Placify — Placement Tracking System

A production-ready full-stack web application for students to track placements, internships, DSA progress, study tasks, and notes.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, Vanilla CSS |
| Backend | Java 17, Spring Boot 3.2.5, Spring Data JPA |
| Database | PostgreSQL 15+ |
| Build | Maven (backend), Vite (frontend) |

---

## Project Structure

```text
Placify/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/placify/
│       │   ├── PlacifyApplication.java
│       │   ├── config/
│       │   ├── controller/
│       │   ├── service/
│       │   ├── repository/
│       │   ├── entity/
│       │   ├── dto/
│       │   └── exception/
│       └── resources/
│           └── application.properties
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── api/
        ├── components/
        ├── pages/
        └── styles/
```

---

## Prerequisites

- **Java 17+** — [Download](https://adoptium.net/)
- **Maven 3.6+** — [Download](https://maven.apache.org/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **PostgreSQL 15+** — [Download](https://www.postgresql.org/)

---

## Database Setup

1. Start PostgreSQL and connect via `psql` or pgAdmin.
2. Create the database:
```sql
CREATE DATABASE placify;
```
3. Update credentials in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/placify
spring.datasource.username=YOUR_POSTGRES_USERNAME
spring.datasource.password=YOUR_POSTGRES_PASSWORD
```

> Tables are automatically created by Hibernate on the first run (`ddl-auto=update`).

---

## Backend Setup

```bash
# Navigate to backend directory
cd backend

# Build the project (skipping tests for speed)
./mvnw clean package -DskipTests

# Run the compiled JAR
java -jar target/placify-backend-1.0.0.jar
```

The backend starts at: **http://localhost:8081** (or the port specified in your environment variables).

---

## Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend starts at: **http://localhost:5173**

> The Vite dev server proxies `/api` requests to `http://localhost:8080` automatically.

---

## API Documentation

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard summary statistics |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | List all applications |
| GET | `/api/applications?status=Applied` | Filter by status |
| GET | `/api/applications/{id}` | Get application by ID |
| POST | `/api/applications` | Create new application |
| PUT | `/api/applications/{id}` | Update application |
| DELETE | `/api/applications/{id}` | Delete application |

**Status values:** `Applied`, `OA_Cleared`, `Interview_Scheduled`, `Rejected`, `Selected`
**Features:** Includes an optional `companyLink` field to redirect users to job postings.

### DSA Tracker
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dsa` | List all DSA topics |
| GET | `/api/dsa/{id}` | Get topic by ID |
| POST | `/api/dsa` | Create topic |
| PUT | `/api/dsa/{id}` | Update topic |
| DELETE | `/api/dsa/{id}` | Delete topic |

### Study Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/{id}` | Get task by ID |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |

**Status values:** `Pending`, `In_Progress`, `Completed`

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List all notes (newest first) |
| GET | `/api/notes/{id}` | Get note by ID |
| POST | `/api/notes` | Create note |
| PUT | `/api/notes/{id}` | Update note |
| DELETE | `/api/notes/{id}` | Delete note |

### Hackathons
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hackathons` | List all hackathons |
| POST | `/api/hackathons` | Add a new hackathon |
| PUT | `/api/hackathons/{id}` | Update hackathon |
| DELETE | `/api/hackathons/{id}` | Delete hackathon |

### LeetCode Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leetcode` | Get saved LeetCode profile linked to user |
| PUT | `/api/leetcode` | Link or update LeetCode profile |
| GET | `/api/leetcode/fetch/{username}` | Fetch live statistics via LeetCode GraphQL API |

---

## Features

| Module | Features |
|--------|----------|
| **Dashboard** | Statistics cards, upcoming deadlines, pending tasks, DSA progress bars, Live LeetCode statistics widget |
| **Applications** | CRUD operations, filter by status, color-coded badges, deadline warnings, company links |
| **DSA Tracker** | Card grid, color-coded progress bars, range slider, completion status |
| **Study Tasks** | CRUD operations, quick completion toggle, overdue highlighting, mini statistics |
| **Notes** | CRUD operations, search functionality, card grid, full-view modal, color accent bars |
| **Hackathons** | Track participated hackathons, project links, dates, and outcomes |
| **LeetCode Sync** | Link your LeetCode handle to view live Total, Easy, Medium, and Hard solved counts |

---

## User Interface

- Dynamic Light/Dark Mode switch with local storage persistence
- Minimalist Monochrome aesthetic (Pure Black & White with subtle grays)
- Glassmorphism cards with gradient accent borders
- Animated sidebar with active state highlighting
- Animated progress bars
- Status badges with appropriate colors
- Responsive layout (mobile-friendly)
- Smooth micro-animations on hover
- Accessible forms with ARIA labels

---

## Configuration

| Setting | Default | File |
|---------|---------|------|
| Backend port | `8080` | `application.properties` |
| Frontend port | `5173` | `vite.config.js` |
| DB name | `placify` | `application.properties` |
| DB user | `postgres` | `application.properties` |
| DB pass | `postgres` | `application.properties` |

---

## Repository

**Source Code**: [forex911/Placify](https://github.com/forex911/Placify)