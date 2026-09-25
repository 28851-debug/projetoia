# Inventory Management System — Roadmap

Every feature is marked complete only after its automated or manual test is represented in the test suite or `api.md`.

## Implementation checklist
- [x] Create backend/frontend folder structure and package scripts.
- [x] Create Roadmap.md, Contexto.md, and API documentation.
- [x] Configure Express, JSON parsing, CORS, static frontend delivery, and both `/api` and bare route prefixes.
- [x] Create SQLite schema for products and inventory movement auditing.
- [x] Implement product model/repository and validation.
- [x] Implement `POST /products` and test valid and invalid creation.
- [x] Implement `GET /products` and `GET /products/:id` and test listing and not-found behavior.
- [x] Implement `PUT /products/:id` and test metadata editing without changing stock.
- [x] Implement `DELETE /products/:id` and test removal.
- [x] Implement `PATCH /products/:id/stock` as an additive-only operation (with POST compatibility) and test `200 + 20 = 220`.
- [x] Implement clear 400 and 404 errors and stock safety rules.
- [x] Implement automated API and service tests.
- [x] Implement frontend product list and real API integration.
- [x] Implement frontend registration, edit, delete, and add-stock actions.
- [x] Document manual frontend verification and curl examples in `api.md`.
- [x] Synchronize final Contexto.md and confirm all roadmap items are complete.

## Completion evidence
- Automated tests are located under `tests/` and run with `npm test`.
- Endpoint request/response examples and copy-ready curl commands are in `api.md`.
