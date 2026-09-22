# Inventory Management System — Development Roadmap

This roadmap tracks the phases, tasks, implementation status, and testing status of the Retail Store Inventory Management System.

---

## Phase 1: Project Setup & Architecture Definition
- [x] Create project directory layout (`backend/`, `frontend/`, `tests/`)
- [x] Configure `package.json` with scripts (`start`, `test`, `test:unit`, `test:integration`)
- [x] Install backend runtime dependencies (`express`, `cors`)
- [x] Initialize documentation files (`Roadmap.md`, `Contexto.md`, `api.md`, `README.md`)
- [x] Establish SQLite database connection with WAL mode and schema migrations

---

## Phase 2: Database Schema & Persistence Layer
- [x] Define and execute `products` table schema
  - [x] `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - [x] `name` (TEXT NOT NULL)
  - [x] `price` (INTEGER NOT NULL in cents)
  - [x] `quantity` (INTEGER NOT NULL CHECK (quantity >= 0))
  - [x] `createdAt` (TEXT ISO8601)
  - [x] `updatedAt` (TEXT ISO8601)
- [x] Define and execute `inventory_movements` table schema
  - [x] `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - [x] `productId` (INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE)
  - [x] `type` (TEXT CHECK (type IN ('ADD', 'REMOVE', 'INITIAL')))
  - [x] `quantity` (INTEGER NOT NULL CHECK (quantity > 0))
  - [x] `previousQuantity` (INTEGER NOT NULL)
  - [x] `newQuantity` (INTEGER NOT NULL)
  - [x] `reason` (TEXT)
  - [x] `createdAt` (TEXT ISO8601)
- [x] Implement `productRepository.js` (CRUD queries, search & filter)
- [x] Implement `movementRepository.js` (Audit logging, history queries)

---

## Phase 3: Core Business Logic & Services
- [x] Implement `productService.js`
  - [x] Validate product name (non-empty, trimmed, string)
  - [x] Validate price (numeric, non-negative, safe cents conversion)
  - [x] Validate initial stock quantity (non-negative integer)
  - [x] Format price safely between decimal input and integer cents storage
- [x] Implement `inventoryService.js`
  - [x] Atomic stock addition (`newQuantity = currentQuantity + quantityToAdd`)
  - [x] Atomic stock removal (`currentQuantity >= quantityToRemove`)
  - [x] Prevent stock from becoming negative (throw 409 Conflict on insufficient stock)
  - [x] Reject non-positive quantities (`<= 0`)
  - [x] Record inventory movements inside transactions
  - [x] Calculate dashboard statistics (total products, total stock, low stock alert count, total inventory value)

---

## Phase 4: API & Controllers Layer
- [x] Implement `errorHandler.js` middleware (standard `{ "error": "message" }` format)
- [x] Implement `productController.js`
  - [x] `POST /api/products` (Create product)
  - [x] `GET /api/products` (List with search/filter)
  - [x] `GET /api/products/:id` (Get product details)
  - [x] `PUT /api/products/:id` (Update product details)
  - [x] `DELETE /api/products/:id` (Delete product)
- [x] Implement `inventoryController.js`
  - [x] `POST /api/products/:id/stock` (Add stock)
  - [x] `POST /api/products/:id/stock/remove` (Remove stock)
  - [x] `GET /api/products/:id/movements` (Product stock history)
  - [x] `GET /api/dashboard/stats` (Aggregated inventory metrics)
- [x] Configure `app.js` and `server.js` (Express app, CORS, JSON parser, static file serving)

---

## Phase 5: Automated Testing
- [x] Unit tests for `productService` (`tests/unit/productService.test.js` - 15 tests)
  - [x] Valid creation
  - [x] Validation errors: empty name, negative price, invalid quantity
  - [x] Edge cases: precision rounding, whitespace trimming
- [x] Unit tests for `inventoryService` (`tests/unit/inventoryService.test.js` - 9 tests)
  - [x] Stock addition and audit logging
  - [x] Stock subtraction and audit logging
  - [x] Insufficient stock rejection
  - [x] Boundary condition: removing to exact zero
  - [x] Invalid quantities (`0`, `-5`, non-integer)
- [x] Integration tests for Product API (`tests/integration/productApi.test.js` - 9 tests)
  - [x] HTTP Statuses: 201 Created, 200 OK, 400 Bad Request, 404 Not Found
- [x] Integration tests for Inventory API (`tests/integration/inventoryApi.test.js` - 7 tests)
  - [x] HTTP Statuses: 200 OK, 400 Bad Request, 409 Conflict, 404 Not Found
  - [x] Stock addition sequence (`200 + 20 = 220`)
  - [x] Stock subtraction sequence (`220 - 15 = 205`)
  - [x] Stock rejection sequence (`205 - 300` -> 409 Conflict, stock unchanged at `205`)
  - [x] Movement audit trail verification
  - [x] Dashboard metrics calculation

---

## Phase 6: Frontend Development
- [x] Semantic HTML (`frontend/index.html`)
  - [x] Header & Brand navigation
  - [x] Dashboard metrics cards (Total Products, Total Stock Units, Low Stock Alert, Inventory Value)
  - [x] Actions toolbar: Search bar, Low-stock filter toggle, "New Product" modal trigger
  - [x] Inventory table with stock level badges and action buttons
  - [x] Add/Remove Stock modal dialog
  - [x] Create/Edit Product modal dialog
  - [x] Movement History audit modal
  - [x] Toast notification container
- [x] Responsive Stylesheet (`frontend/css/styles.css`)
  - [x] Modern CSS variables & typography
  - [x] Clean responsive grid and flexbox layouts
  - [x] Status badges (Green for In Stock, Yellow/Red for Low Stock)
  - [x] Modals, backdrop overlays, and toast animations
- [x] Frontend Logic (`frontend/js/app.js`)
  - [x] REST API client integration (`fetch`, async/await)
  - [x] Dynamic table rendering & real-time search filtering
  - [x] Form submission handling & client validation
  - [x] Add Stock / Remove Stock UI flows updating state from API response
  - [x] Toast notifications for success, validation, and error messages
  - [x] Full Brazilian Portuguese (`pt-BR`) localization and `R$` currency formatting

---

## Phase 7: Verification & Documentation Review
- [x] Run full test suite (`npm test` - 40/40 tests passing)
- [x] Perform live HTTP verification against running backend (`scripts/verify_system.js`)
- [x] Test frontend in browser and verify static asset delivery
- [x] Keep `Roadmap.md`, `Contexto.md`, and `api.md` fully synchronized
- [x] Create `walkthrough.md` with demonstration results

---

## Known Issues
- None.

## Future Improvements
- Barcode / SKU scanning support.
- User authentication and role-based permissions (Admin vs Cashier vs Stock clerk).
- CSV / Excel export and import for inventory batch updates.
- Automated low-stock email / webhook alerts.
