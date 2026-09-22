const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../../backend/src/app');
const { createDatabase } = require('../../backend/src/config/database');
const ProductRepository = require('../../backend/src/repositories/productRepository');
const MovementRepository = require('../../backend/src/repositories/movementRepository');
const ProductService = require('../../backend/src/services/productService');
const InventoryService = require('../../backend/src/services/inventoryService');

describe('Inventory API (HTTP Integration Tests)', () => {
  let server;
  let baseUrl;
  let db;
  let productId;

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

    // Seed product: Keyboard, Price: 50.00, Initial Stock: 200
    const res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Keyboard',
        price: 50.00,
        quantity: 200
      })
    });
    const created = await res.json();
    productId = created.id;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  });

  it('Step 1: Add 20 stock units to Keyboard (200 + 20 = 220)', async () => {
    const res = await fetch(`${baseUrl}/products/${productId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: 20,
        reason: 'Store purchased 20 additional units'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, productId);
    assert.equal(body.quantity, 220);
    assert.equal(body.previousQuantity, 200);
    assert.equal(body.added, 20);

    // Verify GET /products/:id shows 220
    const checkRes = await fetch(`${baseUrl}/products/${productId}`);
    const checkBody = await checkRes.json();
    assert.equal(checkBody.quantity, 220);
  });

  it('Step 2: Remove 15 stock units from Keyboard (220 - 15 = 205)', async () => {
    const res = await fetch(`${baseUrl}/products/${productId}/stock/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: 15,
        reason: 'Sold 15 units to retail customer'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, productId);
    assert.equal(body.quantity, 205);
    assert.equal(body.previousQuantity, 220);
    assert.equal(body.removed, 15);

    // Verify GET /products/:id shows 205
    const checkRes = await fetch(`${baseUrl}/products/${productId}`);
    const checkBody = await checkRes.json();
    assert.equal(checkBody.quantity, 205);
  });

  it('Step 3: Reject attempt to remove 300 units with 409 Conflict, stock remains 205', async () => {
    const res = await fetch(`${baseUrl}/products/${productId}/stock/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: 300,
        reason: 'Attempt invalid bulk withdrawal'
      })
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error, 'Cannot remove 300 units. Only 205 units are currently available.');

    // Crucial check: stock MUST remain untouched at 205
    const checkRes = await fetch(`${baseUrl}/products/${productId}`);
    const checkBody = await checkRes.json();
    assert.equal(checkBody.quantity, 205);
  });

  it('Step 4: Reject non-positive add quantity (0, -10) with 400 Bad Request', async () => {
    const resZero = await fetch(`${baseUrl}/products/${productId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 0 })
    });
    assert.equal(resZero.status, 400);

    const resNeg = await fetch(`${baseUrl}/products/${productId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: -10 })
    });
    assert.equal(resNeg.status, 400);
  });

  it('Step 5: Reject non-positive remove quantity (0, -5) with 400 Bad Request', async () => {
    const resZero = await fetch(`${baseUrl}/products/${productId}/stock/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 0 })
    });
    assert.equal(resZero.status, 400);

    const resNeg = await fetch(`${baseUrl}/products/${productId}/stock/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: -5 })
    });
    assert.equal(resNeg.status, 400);
  });

  it('Step 6: GET /api/products/:id/movements should list all stock events', async () => {
    const res = await fetch(`${baseUrl}/products/${productId}/movements`);
    assert.equal(res.status, 200);
    const movements = await res.json();
    assert.ok(Array.isArray(movements));
    // We had INITIAL (200), ADD (20), REMOVE (15)
    assert.equal(movements.length, 3);
    assert.equal(movements[0].type, 'REMOVE');
    assert.equal(movements[1].type, 'ADD');
    assert.equal(movements[2].type, 'INITIAL');
  });

  it('Step 7: GET /api/dashboard/stats should report accurate dashboard totals', async () => {
    const res = await fetch(`${baseUrl}/dashboard/stats`);
    assert.equal(res.status, 200);
    const stats = await res.json();
    assert.equal(stats.totalProducts, 1);
    assert.equal(stats.totalStockUnits, 205);
    assert.equal(stats.lowStockCount, 0);
    // 205 units * $50.00 = $10,250.00
    assert.equal(stats.totalInventoryValue, 10250.00);
  });
});
