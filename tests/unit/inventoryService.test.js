const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../../backend/src/config/database');
const ProductRepository = require('../../backend/src/repositories/productRepository');
const MovementRepository = require('../../backend/src/repositories/movementRepository');
const ProductService = require('../../backend/src/services/productService');
const InventoryService = require('../../backend/src/services/inventoryService');

describe('InventoryService (Unit Tests)', () => {
  let db;
  let productService;
  let inventoryService;
  let movementRepo;

  beforeEach(() => {
    db = createDatabase(':memory:');
    const productRepo = new ProductRepository(db);
    movementRepo = new MovementRepository(db);
    productService = new ProductService({
      productRepository: productRepo,
      movementRepository: movementRepo,
      db
    });
    inventoryService = new InventoryService({
      productRepository: productRepo,
      movementRepository: movementRepo,
      db
    });
  });

  describe('addStock', () => {
    it('should add stock correctly and record an ADD movement', () => {
      // Example from specification: Keyboard with 200 stock, add 20 -> 220
      const created = productService.createProduct({
        name: 'Keyboard',
        price: 50.00,
        quantity: 200
      });

      const result = inventoryService.addStock(created.id, 20, 'Purchased 20 additional units');
      assert.equal(result.quantity, 220);
      assert.equal(result.previousQuantity, 200);
      assert.equal(result.added, 20);

      // Verify product retrieval reflects updated stock
      const product = productService.getProductById(created.id);
      assert.equal(product.quantity, 220);

      // Verify movements audit trail
      const movements = movementRepo.findByProductId(created.id);
      assert.equal(movements.length, 2); // 1 INITIAL + 1 ADD
      const addMovement = movements[0]; // ordered DESC
      assert.equal(addMovement.type, 'ADD');
      assert.equal(addMovement.quantity, 20);
      assert.equal(addMovement.previousQuantity, 200);
      assert.equal(addMovement.newQuantity, 220);
      assert.equal(addMovement.reason, 'Purchased 20 additional units');
    });

    it('should reject invalid or non-positive quantity', () => {
      const created = productService.createProduct({ name: 'Mouse', price: 25.00, quantity: 10 });

      assert.throws(
        () => inventoryService.addStock(created.id, 0),
        { message: 'Quantity to add must be an integer greater than zero', statusCode: 400 }
      );

      assert.throws(
        () => inventoryService.addStock(created.id, -5),
        { message: 'Quantity to add must be an integer greater than zero', statusCode: 400 }
      );

      assert.throws(
        () => inventoryService.addStock(created.id, 2.5),
        { message: 'Quantity to add must be an integer greater than zero', statusCode: 400 }
      );

      assert.throws(
        () => inventoryService.addStock(created.id, 'ten'),
        { message: 'Quantity to add must be an integer greater than zero', statusCode: 400 }
      );
    });

    it('should reject adding stock to nonexistent product', () => {
      assert.throws(
        () => inventoryService.addStock(999, 10),
        { message: 'Product not found', statusCode: 404 }
      );
    });
  });

  describe('removeStock', () => {
    it('should remove stock correctly and record a REMOVE movement', () => {
      // Starting from 220, remove 5 -> 215
      const created = productService.createProduct({
        name: 'Keyboard',
        price: 50.00,
        quantity: 220
      });

      const result = inventoryService.removeStock(created.id, 5, 'Sold 5 units to retail customer');
      assert.equal(result.quantity, 215);
      assert.equal(result.previousQuantity, 220);
      assert.equal(result.removed, 5);

      const product = productService.getProductById(created.id);
      assert.equal(product.quantity, 215);

      const movements = movementRepo.findByProductId(created.id);
      assert.equal(movements[0].type, 'REMOVE');
      assert.equal(movements[0].quantity, 5);
      assert.equal(movements[0].previousQuantity, 220);
      assert.equal(movements[0].newQuantity, 215);
      assert.equal(movements[0].reason, 'Sold 5 units to retail customer');
    });

    it('should allow removing all stock down to exactly zero', () => {
      const created = productService.createProduct({ name: 'Special Item', price: 100, quantity: 10 });
      const result = inventoryService.removeStock(created.id, 10);
      assert.equal(result.quantity, 0);
      assert.equal(result.isLowStock, true);

      const product = productService.getProductById(created.id);
      assert.equal(product.quantity, 0);
    });

    it('should reject removing more stock than available (prevent negative inventory)', () => {
      const created = productService.createProduct({
        name: 'Keyboard',
        price: 50.00,
        quantity: 3
      });

      // Attempt to remove 5 when only 3 are available
      assert.throws(
        () => inventoryService.removeStock(created.id, 5),
        {
          message: 'Cannot remove 5 units. Only 3 units are currently available.',
          statusCode: 409
        }
      );

      // Verify stock did not change
      const product = productService.getProductById(created.id);
      assert.equal(product.quantity, 3);
    });

    it('should reject removing invalid or non-positive quantity', () => {
      const created = productService.createProduct({ name: 'Item', price: 10, quantity: 20 });

      assert.throws(
        () => inventoryService.removeStock(created.id, 0),
        { message: 'Quantity to remove must be an integer greater than zero', statusCode: 400 }
      );

      assert.throws(
        () => inventoryService.removeStock(created.id, -2),
        { message: 'Quantity to remove must be an integer greater than zero', statusCode: 400 }
      );
    });
  });

  describe('dashboard statistics', () => {
    it('should aggregate total products, total stock, and inventory value', () => {
      productService.createProduct({ name: 'Keyboard', price: 50.00, quantity: 200 }); // value: 10000.00
      productService.createProduct({ name: 'Mouse', price: 25.00, quantity: 10 });     // value: 250.00, low stock
      productService.createProduct({ name: 'Monitor', price: 200.00, quantity: 5 });   // value: 1000.00, low stock

      const stats = inventoryService.getDashboardStats();
      assert.equal(stats.totalProducts, 3);
      assert.equal(stats.totalStockUnits, 215);
      assert.equal(stats.lowStockCount, 2);
      assert.equal(stats.totalInventoryValue, 11250.00);
    });
  });
});
