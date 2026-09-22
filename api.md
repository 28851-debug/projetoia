# Retail Store Inventory Management System — API Documentation

This document describes all REST API endpoints provided by the backend service. All endpoints communicate using JSON and standard HTTP status codes.

Base URL: `http://localhost:3000/api`

---

## 1. List Products

Retrieve all products with optional query filtering for search keywords, price limits, and low-stock thresholds.

- **Method**: `GET`
- **URL**: `/api/products`
- **Purpose**: Fetch product list matching search and filter criteria.

### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `search` | String | No | Search query matching product name (case-insensitive substring) |
| `minPrice` | Number | No | Minimum price in currency units (e.g. `10.00`) |
| `maxPrice` | Number | No | Maximum price in currency units (e.g. `100.00`) |
| `lowStockOnly`| Boolean| No | If `'true'` or `'1'`, returns only products with quantity <= low stock threshold (10) |

### Successful Response
- **Status Code**: `200 OK`
- **Body**: Array of product objects.

```json
[
  {
    "id": 1,
    "name": "Keyboard",
    "price": 50.00,
    "quantity": 200,
    "isLowStock": false,
    "createdAt": "2026-09-22T15:00:00.000Z",
    "updatedAt": "2026-09-22T15:00:00.000Z"
  }
]
```

---

## 2. Get Product by ID

Retrieve a single product by its unique identifier.

- **Method**: `GET`
- **URL**: `/api/products/:id`
- **Purpose**: Fetch details of an individual product.

### URL Parameters
| Parameter | Type | Description |
|---|---|---|
| `id` | Integer | Product ID |

### Successful Response
- **Status Code**: `200 OK`
- **Body**:

```json
{
  "id": 1,
  "name": "Keyboard",
  "price": 50.00,
  "quantity": 200,
  "isLowStock": false,
  "createdAt": "2026-09-22T15:00:00.000Z",
  "updatedAt": "2026-09-22T15:00:00.000Z"
}
```

### Error Responses
- **400 Bad Request**: If ID is not a positive integer.
  ```json
  { "error": "Invalid product ID" }
  ```
- **404 Not Found**: If product does not exist.
  ```json
  { "error": "Product not found" }
  ```

---

## 3. Create Product

Create a new product in the store catalog with an initial stock quantity.

- **Method**: `POST`
- **URL**: `/api/products`
- **Purpose**: Add a new product to the catalog.

### Request Body
```json
{
  "name": "Keyboard",
  "price": 50.00,
  "quantity": 200
}
```

### Fields
| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `name` | String | Yes | Non-empty string after trimming whitespace. Max 200 characters. |
| `price` | Number | Yes | Numeric, non-negative (>= 0). Up to 2 decimal places. |
| `quantity` | Integer | Yes | Non-negative integer (>= 0). |

### Successful Response
- **Status Code**: `201 Created`
- **Body**:

```json
{
  "id": 1,
  "name": "Keyboard",
  "price": 50.00,
  "quantity": 200,
  "createdAt": "2026-09-22T15:00:00.000Z",
  "updatedAt": "2026-09-22T15:00:00.000Z"
}
```

### Error Responses
- **400 Bad Request**: Validation failure.
  ```json
  { "error": "Product name is required and cannot be empty" }
  ```
  ```json
  { "error": "Price must be a non-negative number" }
  ```
  ```json
  { "error": "Quantity must be a non-negative integer" }
  ```

---

## 4. Update Product

Update an existing product's metadata (name and price). Stock adjustments must be performed through the dedicated stock endpoints.

- **Method**: `PUT`
- **URL**: `/api/products/:id`
- **Purpose**: Update a product's name and price.

### Request Body
```json
{
  "name": "Mechanical Keyboard RGB",
  "price": 65.50
}
```

### Fields
| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `name` | String | No | If provided, non-empty trimmed string. |
| `price` | Number | No | If provided, non-negative number. |

### Successful Response
- **Status Code**: `200 OK`
- **Body**: Updated product object.

### Error Responses
- **400 Bad Request**: Invalid fields or no fields provided to update.
- **404 Not Found**: Product not found.

---

## 5. Delete Product

Delete a product and its associated stock movement records.

- **Method**: `DELETE`
- **URL**: `/api/products/:id`
- **Purpose**: Remove a product from the catalog.

### Successful Response
- **Status Code**: `200 OK`
- **Body**:
```json
{ "message": "Product successfully deleted" }
```

### Error Responses
- **404 Not Found**: Product not found.

---

## 6. Add Stock

Add inventory units to an existing product. Backend atomically recalculates `newQuantity = currentQuantity + quantityToAdd` and logs the transaction.

- **Method**: `POST`
- **URL**: `/api/products/:id/stock`
- **Purpose**: Safely increase stock inventory.

### Request Body
```json
{
  "quantity": 20,
  "reason": "Restocked from warehouse supplier"
}
```

### Fields
| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `quantity` | Integer | Yes | Integer strictly greater than 0. |
| `reason` | String | No | Optional description of the restocking reason. |

### Successful Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "id": 1,
  "name": "Keyboard",
  "price": 50.00,
  "quantity": 220,
  "previousQuantity": 200,
  "added": 20,
  "updatedAt": "2026-09-22T15:05:00.000Z"
}
```

### Error Responses
- **400 Bad Request**: If quantity is missing, not an integer, or <= 0.
  ```json
  { "error": "Quantity to add must be an integer greater than zero" }
  ```
- **404 Not Found**:
  ```json
  { "error": "Product not found" }
  ```

---

## 7. Remove Stock

Deduct inventory units when sold or damaged. Backend verifies stock availability and guarantees the inventory never falls below zero.

- **Method**: `POST`
- **URL**: `/api/products/:id/stock/remove`
- **Purpose**: Safely decrease stock inventory.

### Request Body
```json
{
  "quantity": 5,
  "reason": "Customer sale order #1042"
}
```

### Fields
| Field | Type | Required | Validation Rules |
|---|---|---|---|
| `quantity` | Integer | Yes | Integer strictly greater than 0. |
| `reason` | String | No | Optional note/reason for removal. |

### Successful Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "id": 1,
  "name": "Keyboard",
  "price": 50.00,
  "quantity": 215,
  "previousQuantity": 220,
  "removed": 5,
  "updatedAt": "2026-09-22T15:10:00.000Z"
}
```

### Error Responses
- **400 Bad Request**:
  ```json
  { "error": "Quantity to remove must be an integer greater than zero" }
  ```
- **404 Not Found**:
  ```json
  { "error": "Product not found" }
  ```
- **409 Conflict**: When requested removal exceeds current stock.
  ```json
  { "error": "Cannot remove 300 units. Only 205 units are currently available." }
  ```

---

## 8. View Stock Movement History

Retrieve all historical additions, removals, and initial stock events for a specific product.

- **Method**: `GET`
- **URL**: `/api/products/:id/movements`
- **Purpose**: Inspect audit trail of inventory operations.

### Successful Response
- **Status Code**: `200 OK`
- **Body**:
```json
[
  {
    "id": 3,
    "productId": 1,
    "type": "REMOVE",
    "quantity": 5,
    "previousQuantity": 220,
    "newQuantity": 215,
    "reason": "Customer sale order #1042",
    "createdAt": "2026-09-22T15:10:00.000Z"
  },
  {
    "id": 2,
    "productId": 1,
    "type": "ADD",
    "quantity": 20,
    "previousQuantity": 200,
    "newQuantity": 220,
    "reason": "Restocked from warehouse supplier",
    "createdAt": "2026-09-22T15:05:00.000Z"
  },
  {
    "id": 1,
    "productId": 1,
    "type": "INITIAL",
    "quantity": 200,
    "previousQuantity": 0,
    "newQuantity": 200,
    "reason": "Initial inventory on product creation",
    "createdAt": "2026-09-22T15:00:00.000Z"
  }
]
```

---

## 9. Dashboard Statistics

Retrieve key operational metrics for the inventory dashboard.

- **Method**: `GET`
- **URL**: `/api/dashboard/stats`
- **Purpose**: Fetch summary counters for dashboard cards.

### Successful Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "totalProducts": 1,
  "totalStockUnits": 215,
  "lowStockCount": 0,
  "totalInventoryValue": 10750.00
}
```
