# Walkthrough - Retail Store Inventory Management System

We have successfully designed, built, tested, and documented the complete **Inventory Management System** for retail store operations.

Project Location: `C:\Users\Aluno\.gemini\antigravity\scratch\inventory-management-system`

---

## What Was Implemented

### 1. Clean Multi-Layer Architecture
- **Routes Layer** (`backend/src/routes/productRoutes.js`): Clean HTTP verb and route mapping.
- **Controllers Layer** (`backend/src/controllers/productController.js`, `backend/src/controllers/inventoryController.js`): Parameter extraction, HTTP status dispatching, and response formatting.
- **Services Layer** (`backend/src/services/productService.js`, `backend/src/services/inventoryService.js`): Business rules, input validation, atomic inventory additions/subtractions, and dashboard metrics.
- **Repositories Layer** (`backend/src/repositories/productRepository.js`, `backend/src/repositories/movementRepository.js`): SQL queries, prepared statements, and transactions.
- **Database & Persistence** (`backend/src/config/database.js`): SQLite with WAL mode, foreign keys, and structured table schemas (`products`, `inventory_movements`).

### 2. Monetary & Stock Safety Guarantees
- **No Floating-Point Errors**: Prices are stored internally as integer cents (e.g., $50.00 = 5000 cents).
- **Atomic Operations**: Backend calculates `newQuantity = currentQuantity + quantityToAdd` or `newQuantity = currentQuantity - quantityToRemove`.
- **Negative Stock Prevention**: Stock removal requests exceeding current inventory are rejected with `HTTP 409 Conflict` (e.g. `Cannot remove 300 units. Only 205 units are currently available.`), guaranteeing that inventory never drops below 0.
- **Audit Logging**: Every creation, addition, and removal creates an immutable entry in `inventory_movements`.

### 3. Responsive Web Frontend
- Semantic HTML (`frontend/index.html`): Clean single-page application with dashboard KPI cards, search toolbar, low-stock filter toggle, inventory table, and modals.
- Modern CSS (`frontend/css/styles.css`): Design tokens, responsive grid, status badges (In Stock vs Low Stock), modal animations, and non-blocking toast notifications.
- Vanilla JavaScript (`frontend/js/app.js`): REST API client, debounced search, modal dialog managers, dynamic stock preview calculations, and toast alerts.

### 4. Mandatory Documentation Files
- `Roadmap.md`: Development phases, tasks, subtasks, checkboxes, test statuses, and future enhancements.
- `Contexto.md`: Architecture snapshot, tech stack, database schema, business rules, and technical decisions.
- `api.md`: Complete REST API specification with endpoints, schemas, validation rules, HTTP status codes, and request/response examples.
- `README.md`: Setup instructions, server commands, and testing guide.

---

## Verification & Test Results

### Automated Test Suite: 40 / 40 Passing

Executed via `npm test` using Node.js's built-in test runner:
- 24 unit tests across `productService` and `inventoryService`
- 16 HTTP integration tests across `productApi` and `inventoryApi`

### End-to-End Live Workflow Verification

Executed via `node scripts/verify_system.js` testing against an active HTTP server:
- Frontend static file delivery verified (`index.html`, `styles.css`, `app.js`)
- Full store scenario tested:
  - Product: Keyboard, Price: $50.00, Quantity: 200
  - Stock addition (+20) -> 220
  - Stock removal (-15) -> 205
  - Stock rejection (-300) -> HTTP 409 Conflict, stock safely preserved at 205
  - Full movement history verified (3 entries: INITIAL, ADD, REMOVE)
  - Dashboard counters verified (205 total units, $10,250.00 valuation)

---

## How to Run the Application

1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd C:\Users\Aluno\.gemini\antigravity\scratch\inventory-management-system
   ```

2. Start the server:
   ```powershell
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
