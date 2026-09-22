# Project Context — Retail Store Inventory Management System

## Project Purpose
The purpose of this system is to provide a reliable, performant, and user-friendly inventory management platform for retail store operations. It tracks product catalogs, pricing, stock levels, and historical stock movements (additions and sales/removals) while enforcing strict data consistency, preventing negative inventory, and providing a clean web interface for store managers.

---

## Current Architecture
The system follows a strict multi-layer separation of concerns:
```
Client (HTML5 / CSS3 / Vanilla JS in `frontend/`)
       ↓  HTTP / REST JSON
Express Application (CORS, JSON Body Parser, Static Asset Server)
       ↓
Routes Layer (`src/routes/productRoutes.js`)
       ↓
Controllers Layer (`src/controllers/productController.js`, `inventoryController.js`)
       ↓
Services Layer (`src/services/productService.js`, `inventoryService.js`)
       ↓
Repositories Layer (`src/repositories/productRepository.js`, `movementRepository.js`)
       ↓
Database Layer (`src/config/database.js`) - SQLite DatabaseSync (WAL mode)
```

---

## Technologies Being Used
- **Runtime**: Node.js (v24.11.1)
- **Backend Framework**: Express 4.21.x
- **Database**: SQLite (`node:sqlite` DatabaseSync built into Node.js 22+)
- **Testing**: Node.js native test runner (`node:test` + `node:assert`)
- **Frontend**: Vanilla HTML5, modern CSS3, and ES6+ JavaScript (no heavy external frontend framework)
- **Utilities**: CORS middleware

---

## Database Structure
Persistent SQLite database stored at `backend/data/inventory.db` (or `:memory:` during testing):

### Table: `products`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique product identifier |
| `name` | TEXT | NOT NULL | Product name (trimmed, non-empty) |
| `price` | INTEGER | NOT NULL CHECK (price >= 0) | Price stored in integer cents (e.g. 5000 for $50.00) |
| `quantity` | INTEGER | NOT NULL CHECK (quantity >= 0) | Current stock quantity (never negative) |
| `createdAt` | TEXT | NOT NULL | ISO8601 creation timestamp |
| `updatedAt` | TEXT | NOT NULL | ISO8601 update timestamp |

### Table: `inventory_movements`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique movement log ID |
| `productId` | INTEGER | NOT NULL REFERENCES products(id) ON DELETE CASCADE | Target product |
| `type` | TEXT | NOT NULL CHECK (type IN ('INITIAL', 'ADD', 'REMOVE')) | Movement type |
| `quantity` | INTEGER | NOT NULL CHECK (quantity > 0) | Quantity added or removed |
| `previousQuantity` | INTEGER | NOT NULL | Stock quantity before the operation |
| `newQuantity` | INTEGER | NOT NULL | Stock quantity after the operation |
| `reason` | TEXT | NULLABLE | Reason or note for the movement |
| `createdAt` | TEXT | NOT NULL | ISO8601 timestamp |

---

## API Structure
All endpoints are prefixed with `/api`:
- `GET /api/products` — List products (with optional search and filtering)
- `POST /api/products` — Create a new product
- `GET /api/products/:id` — Get product details by ID
- `PUT /api/products/:id` — Update product name and price
- `DELETE /api/products/:id` — Delete a product
- `POST /api/products/:id/stock` — Add stock to product (`{ quantity, reason? }`)
- `POST /api/products/:id/stock/remove` — Remove stock from product (`{ quantity, reason? }`)
- `GET /api/products/:id/movements` — Retrieve audit history for a product
- `GET /api/dashboard/stats` — Retrieve summary statistics for the inventory dashboard

---

## Frontend Structure
Located in `frontend/`:
- `index.html`: Dashboard layout, product list table, modal dialogs for stock adjustments, product creation/editing, and movement history, plus toast container.
- `css/styles.css`: Modern styling, custom properties, responsive layout, modal overlays, badges, and alerts.
- `js/app.js`: State manager, REST API consumer, form submission handlers, dynamic DOM rendering, and user feedback toast triggers.

---

## Important Business Rules
1. **Monetary Integrity**: Product prices must be numeric and non-negative. Stored internally as integer cents and formatted to 2 decimal places in API responses.
2. **Stock Non-Negativity**: Stock quantity must never drop below 0. Removal attempts exceeding available stock are rejected with HTTP 409 Conflict.
3. **Strict Validation**:
   - Product name must be a non-empty string.
   - Stock adjustments must be positive integers (`quantity > 0`).
   - Server-side calculation only (`newQuantity = currentQuantity + quantityToAdd`). Client quantities are never trusted.
4. **Audit Trail**: Every inventory adjustment (creation, addition, removal) creates an immutable record in `inventory_movements` within an atomic transaction.

---

## Current Implementation Status
- **All Phases (1 through 7) Completed**:
  - Full backend architecture implemented and verified.
  - Complete automated test suite (40 tests across unit and HTTP integration suites passing).
  - Web frontend implemented with vanilla HTML5, CSS3, and JavaScript.
  - Full end-to-end verification passed against running server.
- **Current Task**: Completed. Project is ready for production and active use.

---

## Completed Functionality
- Full Product CRUD with validation and safe pricing.
- Atomic stock addition with transaction logging (`POST /api/products/:id/stock`).
- Safe stock removal with non-negative constraints and 409 rejection (`POST /api/products/:id/stock/remove`).
- Complete movement audit history (`GET /api/products/:id/movements`).
- Real-time dashboard statistics (`GET /api/dashboard/stats`).
- Automated unit test suite (24 tests).
- Automated HTTP integration test suite (16 tests).
- End-to-end live HTTP workflow verification (`scripts/verify_system.js`).
- Complete Portuguese localization (`pt-BR`) for the frontend interface with currency formatted in `R$`.
- Complete documentation (`Roadmap.md`, `Contexto.md`, `api.md`, `README.md`, `walkthrough.md`).

---

## Known Problems
- None.

---

## Important Technical Decisions
- **Native SQLite (`node:sqlite`)**: High performance, zero external native compilation build tools, synchronous transaction safety, and WAL mode.
- **Integer Cents Representation**: Eliminates monetary calculation errors (e.g., `0.1 + 0.2 = 0.30000000000000004`).
- **Dual Testing Strategy**: Service unit tests for fine-grained boundary testing; HTTP API tests for realistic contract testing against live server ports.

---

## Next Recommended Steps
- Start the server using `npm start` in `C:\Users\Aluno\.gemini\antigravity\scratch\inventory-management-system`.
- Access the web frontend at `http://localhost:3000`.
