# Retail Store Inventory Management System

A production-ready, full-stack inventory management web application for retail store operations. Built with Node.js, Express, SQLite, and modern Vanilla HTML/CSS/JavaScript.

---

## Features
- **Product Catalog Management**: Create, list, search, filter, update, and delete products.
- **Accurate Monetary Representation**: Prices are represented internally as integer cents to avoid floating-point rounding errors.
- **Atomic Inventory Operations**:
  - Add stock: automatically recalculates total stock server-side.
  - Remove stock: validates stock levels and guarantees inventory can never drop below zero.
- **Audit History**: Complete transaction log (`inventory_movements`) of all additions, removals, and initial stock events.
- **Operational Dashboard**: Real-time counters for Total Products, Total Stock Units, Low Stock Alerts, and Total Inventory Valuation.
- **Clean Architecture**: Strict separation of concerns (Routes → Controllers → Services → Repositories → SQLite Database).
- **Responsive Web Frontend**: Lightweight, fast, vanilla HTML5, CSS3, and JavaScript without bloated frameworks.
- **Comprehensive Automated Tests**: Unit tests and HTTP API integration tests using Node's built-in test runner.

---

## Directory Structure
```
inventory-management-system/
├── frontend/
│   ├── index.html         # Single-page dashboard & modal UI
│   ├── css/
│   │   └── styles.css     # Clean, responsive CSS styling
│   └── js/
│       └── app.js         # API integration & reactive DOM logic
├── backend/
│   ├── data/              # Persistent SQLite database storage
│   └── src/
│       ├── config/        # Database setup and migrations
│       ├── repositories/  # SQL queries and transaction management
│       ├── services/      # Business logic & stock calculations
│       ├── controllers/   # Request parsing & HTTP responses
│       ├── routes/        # Express router declarations
│       ├── middleware/    # Error handling & validation middleware
│       ├── app.js         # Express app configuration
│       └── server.js      # Server startup entry point
├── tests/
│   ├── unit/              # Unit tests for services and business logic
│   └── integration/       # HTTP API integration tests
├── Roadmap.md             # Development phases and task checklist
├── Contexto.md            # Technical context and architectural snapshot
├── api.md                 # Full REST API endpoint specification
└── README.md              # Project overview and instructions
```

---

## Prerequisites
- **Node.js**: v22.5.0 or higher (Node v24.11.1 recommended)
- **npm**: v10+

---

## Installation & Setup

1. Open a terminal in the project directory:
   ```powershell
   cd C:\Users\Aluno\.gemini\antigravity\scratch\inventory-management-system
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the application server:
   ```powershell
   npm start
   ```
   The backend server will run on `http://localhost:3000`.

4. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Running Automated Tests

Run the full automated test suite:
```powershell
npm test
```

Run only unit tests:
```powershell
npm run test:unit
```

Run only HTTP API integration tests:
```powershell
npm run test:integration
```
