const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../../backend/src/app');
const { createDatabase } = require('../../backend/src/config/database');
const ProductRepository = require('../../backend/src/repositories/productRepository');
const MovementRepository = require('../../backend/src/repositories/movementRepository');
const ProductService = require('../../backend/src/services/productService');
const InventoryService = require('../../backend/src/services/inventoryService');

describe('Product API (HTTP Integration Tests)', () => {
  let server;
  let baseUrl;
  let db;

  before(async () => {
    db = createDatabase(':memory:');
    const productRepo = new ProductRepository(db);
    const movementRepo = new MovementRepository(db);
    const productService = new ProductService({ productRepository: productRepo, movementRepository: movementRepo, db });
    const inventoryService = new InventoryService({ productRepository: productRepo, movementRepository: movementRepo, db });

    const app = createApp({ productService, inventoryService });

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  });

  it('POST /api/products should create product and return 201', async () => {
    const res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Keyboard',
        price: 50.00,
        quantity: 200
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.id, 1);
    assert.equal(body.name, 'Keyboard');
    assert.equal(body.price, 50.00);
    assert.equal(body.quantity, 200);
  });

  it('POST /api/products with empty name should return 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '   ',
        price: 50.00,
        quantity: 10
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Product name is required and cannot be empty');
  });

  it('POST /api/products with negative price should return 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Headphones',
        price: -19.99,
        quantity: 10
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Price must be a non-negative number');
  });

  it('POST /api/products with negative quantity should return 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Headphones',
        price: 49.99,
        quantity: -5
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Quantity must be a non-negative integer');
  });

  it('GET /api/products should return list of products', async () => {
    const res = await fetch(`${baseUrl}/products`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 1);
    assert.equal(body[0].name, 'Keyboard');
  });

  it('GET /api/products/:id should return single product', async () => {
    const res = await fetch(`${baseUrl}/products/1`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, 1);
    assert.equal(body.name, 'Keyboard');
  });

  it('GET /api/products/9999 should return 404 Not Found', async () => {
    const res = await fetch(`${baseUrl}/products/9999`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Product not found');
  });

  it('PUT /api/products/1 should update name and price', async () => {
    const res = await fetch(`${baseUrl}/products/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mechanical Gaming Keyboard',
        price: 79.99
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.name, 'Mechanical Gaming Keyboard');
    assert.equal(body.price, 79.99);
    assert.equal(body.quantity, 200); // stock unaffected
  });

  it('DELETE /api/products/1 should remove the product', async () => {
    const res = await fetch(`${baseUrl}/products/1`, {
      method: 'DELETE'
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Product successfully deleted');

    // Confirm it's gone
    const checkRes = await fetch(`${baseUrl}/products/1`);
    assert.equal(checkRes.status, 404);
  });
});
