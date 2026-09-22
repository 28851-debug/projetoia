const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../../backend/src/config/database');
const ProductRepository = require('../../backend/src/repositories/productRepository');
const MovementRepository = require('../../backend/src/repositories/movementRepository');
const ProductService = require('../../backend/src/services/productService');

describe('ProductService (Unit Tests)', () => {
  let db;
  let productService;
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
  });

  describe('createProduct', () => {
    it('should successfully create a product with valid data', () => {
      const product = productService.createProduct({
        name: 'Keyboard',
        price: 50.00,
        quantity: 200
      });

      assert.equal(product.id, 1);
      assert.equal(product.name, 'Keyboard');
      assert.equal(product.price, 50.00);
      assert.equal(product.quantity, 200);
      assert.equal(product.isLowStock, false);
      assert.ok(product.createdAt);
      assert.ok(product.updatedAt);

      // Verify initial movement was recorded
      const movements = movementRepo.findByProductId(product.id);
      assert.equal(movements.length, 1);
      assert.equal(movements[0].type, 'INITIAL');
      assert.equal(movements[0].quantity, 200);
      assert.equal(movements[0].previousQuantity, 0);
      assert.equal(movements[0].newQuantity, 200);
    });

    it('should create a product with 0 initial quantity without movement', () => {
      const product = productService.createProduct({
        name: 'Empty Stock Item',
        price: 9.99,
        quantity: 0
      });

      assert.equal(product.quantity, 0);
      assert.equal(product.isLowStock, true);
      const movements = movementRepo.findByProductId(product.id);
      assert.equal(movements.length, 0);
    });

    it('should reject empty or missing product name', () => {
      assert.throws(
        () => productService.createProduct({ name: '', price: 10, quantity: 5 }),
        { message: 'Product name is required and cannot be empty', statusCode: 400 }
      );

      assert.throws(
        () => productService.createProduct({ name: '   ', price: 10, quantity: 5 }),
        { message: 'Product name is required and cannot be empty', statusCode: 400 }
      );

      assert.throws(
        () => productService.createProduct({ price: 10, quantity: 5 }),
        { message: 'Product name is required and cannot be empty', statusCode: 400 }
      );
    });

    it('should reject product name exceeding 200 characters', () => {
      const longName = 'A'.repeat(201);
      assert.throws(
        () => productService.createProduct({ name: longName, price: 10, quantity: 5 }),
        { message: 'Product name must not exceed 200 characters', statusCode: 400 }
      );
    });

    it('should reject invalid or negative price', () => {
      assert.throws(
        () => productService.createProduct({ name: 'Valid', price: -5, quantity: 5 }),
        { message: 'Price must be a non-negative number', statusCode: 400 }
      );

      assert.throws(
        () => productService.createProduct({ name: 'Valid', price: 'abc', quantity: 5 }),
        { message: 'Price must be a non-negative number', statusCode: 400 }
      );

      assert.throws(
        () => productService.createProduct({ name: 'Valid', quantity: 5 }),
        { message: 'Price is required', statusCode: 400 }
      );
    });

    it('should reject invalid or negative quantity', () => {
      assert.throws(
        () => productService.createProduct({ name: 'Valid', price: 10, quantity: -1 }),
        { message: 'Quantity must be a non-negative integer', statusCode: 400 }
      );

      assert.throws(
        () => productService.createProduct({ name: 'Valid', price: 10, quantity: 2.5 }),
        { message: 'Quantity must be a non-negative integer', statusCode: 400 }
      );
    });
  });

  describe('getProducts and search', () => {
    beforeEach(() => {
      productService.createProduct({ name: 'Mechanical Keyboard', price: 100.00, quantity: 15 });
      productService.createProduct({ name: 'Wireless Mouse', price: 30.00, quantity: 4 });
      productService.createProduct({ name: 'USB-C Cable', price: 15.00, quantity: 50 });
    });

    it('should return all products', () => {
      const all = productService.getProducts();
      assert.equal(all.length, 3);
    });

    it('should filter by search keyword', () => {
      const filtered = productService.getProducts({ search: 'mouse' });
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].name, 'Wireless Mouse');
    });

    it('should filter by low stock only', () => {
      const lowStock = productService.getProducts({ lowStockOnly: true });
      assert.equal(lowStock.length, 1);
      assert.equal(lowStock[0].name, 'Wireless Mouse');
      assert.equal(lowStock[0].isLowStock, true);
    });

    it('should filter by price range', () => {
      const range = productService.getProducts({ minPrice: 20, maxPrice: 100 });
      assert.equal(range.length, 2);
    });
  });

  describe('getProductById', () => {
    it('should return product by id', () => {
      const created = productService.createProduct({ name: 'Monitor', price: 250.00, quantity: 8 });
      const found = productService.getProductById(created.id);
      assert.equal(found.name, 'Monitor');
      assert.equal(found.price, 250.00);
      assert.equal(found.isLowStock, true);
    });

    it('should throw NotFoundError for non-existing id', () => {
      assert.throws(
        () => productService.getProductById(999),
        { message: 'Product not found', statusCode: 404 }
      );
    });

    it('should throw BadRequestError for invalid id', () => {
      assert.throws(
        () => productService.getProductById('invalid'),
        { message: 'Invalid product ID', statusCode: 400 }
      );
    });
  });

  describe('updateProduct', () => {
    it('should update name and price', () => {
      const created = productService.createProduct({ name: 'Old Name', price: 20.00, quantity: 5 });
      const updated = productService.updateProduct(created.id, {
        name: 'New Name',
        price: 25.50
      });

      assert.equal(updated.name, 'New Name');
      assert.equal(updated.price, 25.50);
      assert.equal(updated.quantity, 5); // Stock unchanged
    });

    it('should throw error when no fields provided for update', () => {
      const created = productService.createProduct({ name: 'Item', price: 10.00, quantity: 2 });
      assert.throws(
        () => productService.updateProduct(created.id, {}),
        { statusCode: 400 }
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete existing product', () => {
      const created = productService.createProduct({ name: 'To Delete', price: 10, quantity: 2 });
      const res = productService.deleteProduct(created.id);
      assert.equal(res.success, true);

      assert.throws(
        () => productService.getProductById(created.id),
        { statusCode: 404 }
      );
    });
  });
});
