# Inventory API

The backend exposes the required REST API both at `http://localhost:3000/products` and, for compatibility with the frontend and previous clients, under the `/api` prefix (`http://localhost:3000/api/products`). All responses are JSON and CORS is enabled.

## Product object

```json
{
  "id": 1,
  "name": "Keyboard",
  "price": 50,
  "quantity": 200,
  "createdAt": "2026-09-25T12:00:00.000Z",
  "updatedAt": "2026-09-25T12:00:00.000Z"
}
```

Prices must be greater than zero. Product quantity accepts zero or any positive integer. Stock increments accept only positive integers and always calculate `new quantity = current quantity + added quantity`.

## Endpoints

### GET `/products`
Lists all products. Optional query parameters: `search`, `minPrice`, `maxPrice`, and `lowStockOnly=true`.

```bash
curl http://localhost:3000/products
```

Success: `200 OK`, an array of product objects.

### GET `/products/:id`
Retrieves one product.

```bash
curl http://localhost:3000/products/1
```

Success: `200 OK`. Invalid IDs return `400`; missing products return `404` with `{ "error": "Product not found" }`.

### POST `/products`
Creates a product.

Request body:

```json
{ "name": "Keyboard", "price": 50.00, "quantity": 200 }
```

```bash
curl -X POST http://localhost:3000/products -H "Content-Type: application/json" -d '{"name":"Keyboard","price":50,"quantity":200}'
```

Success: `201 Created`, the created product. Validation errors return `400`.

### PUT `/products/:id`
Updates the product name and/or price. Quantity is deliberately not accepted here; use the stock endpoint for increments.

Request body:

```json
{ "name": "Mechanical Keyboard", "price": 65.50 }
```

```bash
curl -X PUT http://localhost:3000/products/1 -H "Content-Type: application/json" -d '{"name":"Mechanical Keyboard","price":65.5}'
```

Success: `200 OK`; validation errors return `400`; missing products return `404`.

### DELETE `/products/:id`
Removes a product and its movement history.

```bash
curl -X DELETE http://localhost:3000/products/1
```

Success: `200 OK`, `{ "success": true, "message": "Product successfully deleted" }`. Missing products return `404`.

### PATCH `/products/:id/stock`
Adds stock to the existing quantity. This is an increment and never a replacement. The legacy `POST` method for this same path is also supported.

Request body:

```json
{ "quantity": 20, "reason": "New purchase" }
```

```bash
curl -X PATCH http://localhost:3000/products/1/stock -H "Content-Type: application/json" -d '{"quantity":20,"reason":"New purchase"}'
```

Success: `200 OK`:

```json
{ "id": 1, "name": "Keyboard", "price": 50, "quantity": 220, "previousQuantity": 200, "added": 20, "updatedAt": "2026-09-25T12:05:00.000Z" }
```

Zero, negative, fractional, or missing quantities return `400`. Missing products return `404`.

## Error format

All handled errors use `{ "error": "clear message" }`. Common statuses are `400 Bad Request`, `404 Not Found`, and `409 Conflict` for an attempted stock removal greater than the available quantity. The frontend uses the add-stock endpoint and does not replace stock totals.

## Automated test record

The repository includes native Node.js integration and unit tests covering product CRUD, validation, the `200 + 20 = 220` increment sequence, invalid stock quantities, stock removal safeguards, movement history, and dashboard totals. Run them with:

```bash
npm test
```

The existing integration suite records successful HTTP status and response assertions for the complete CRUD and stock workflows; the canonical increment endpoint is additionally available as `PATCH`.
