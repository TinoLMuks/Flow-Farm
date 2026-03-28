# Flow Farm - Smart Aquaponics Farming System (SAFS)

A real-time aquaponics monitoring and management system built with React + Vite (frontend) and Node.js/Express + MySQL (backend).

## Prerequisites

- Node.js 18+
- MySQL 8.0+

## Getting Started

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Set up the MySQL database

Create the database and tables by running the schema file:

```bash
mysql -u root -p < file/safs_schema.sql
```

This creates the `safs_db` database with all required tables, views, and default seed data for roles and sensor types.

### 3. Load seed data (optional, for development/demo)

```bash
mysql -u root -p safs_db < database/seed.sql
```

This populates the database with sample users, tanks, sensors, readings, alerts, feeding schedules, and messages.

### 4. Configure environment variables

Copy the example env file and fill in your MySQL credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=safs_db
PORT=5000
```

### 5. Run the application

Start the backend server:

```bash
node server.js
```

Start the frontend dev server (in a separate terminal):

```bash
npm run dev
```

The frontend will connect to the backend API at `http://localhost:5000/api` by default. To change this, set `VITE_API_URL` in your `.env` file.

## Project Structure

```
├── server.js                  # Express backend entry point
├── database/
│   └── seed.sql               # Demo/test seed data
├── file/
│   ├── safs_schema.sql        # MySQL schema (source of truth)
│   ├── safs_queries.sql       # Query reference library
│   ├── SAFS_ERD.mermaid       # Entity relationship diagram
│   └── SAFS_Database_Design_Document.docx
├── src/
│   ├── config/
│   │   └── db.js              # MySQL connection pool
│   ├── middleware/
│   │   └── errorHandler.js    # Global error & 404 handling
│   ├── routes/                # Express API routes (one file per entity)
│   │   ├── index.js
│   │   ├── sensors.js
│   │   ├── tanks.js
│   │   ├── alerts.js
│   │   ├── feeding.js
│   │   ├── systemHealth.js
│   │   ├── users.js
│   │   ├── thresholds.js
│   │   ├── messages.js
│   │   ├── auditLog.js
│   │   ├── passwordResets.js
│   │   └── verificationCodes.js
│   └── components/            # React frontend components
│       ├── auth/
│       └── dashboard/
```

## API Endpoints

All endpoints return `{ success: true, data: ... }` or `{ success: false, error: ... }`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tanks` | List active tanks |
| GET | `/api/sensors` | List all sensors |
| POST | `/api/sensors/readings` | Ingest sensor reading (ESP32) |
| GET | `/api/sensors/readings/latest/:tankId` | Latest readings per sensor type |
| GET | `/api/sensors/readings/range/:tankId` | Readings over time range |
| GET | `/api/alerts` | Recent alerts |
| GET | `/api/system-health/:tankId` | Latest health snapshot |
| GET | `/api/feeding/schedules/:tankId` | Today's feeding schedule |
| POST | `/api/feeding/logs` | Log feeding event |
| GET | `/api/messages/unread-count/:userId` | Unread message count |
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login lookup |
