const ProductRepository = require('../repositories/productRepository');
const MovementRepository = require('../repositories/movementRepository');
const { getDatabase } = require('../config/database');
const { BadRequestError, NotFoundError } = require('../utils/errors');

class ProductService {
  constructor({ productRepository, movementRepository, db } = {}) {
    this._db = db;
    this.productRepo = productRepository || new ProductRepository(db);
    this.movementRepo = movementRepository || new MovementRepository(db);
  }

  get db() {
    return this._db || getDatabase();
  }

  _formatProduct(product) {
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      price: Number((product.price / 100).toFixed(2)),
      quantity: product.quantity,
      isLowStock: product.quantity <= 10,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }

  createProduct({ name, price, quantity = 0 }) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new BadRequestError('Product name is required and cannot be empty');
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 200) {
      throw new BadRequestError('Product name must not exceed 200 characters');
    }

    if (price === undefined || price === null || price === '') {
      throw new BadRequestError('Price is required');
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      throw new BadRequestError('Price must be a non-negative number');
    }
    const priceCents = Math.round(numPrice * 100);

    const numQty = Number(quantity);
    if (!Number.isInteger(numQty) || numQty < 0) {
      throw new BadRequestError('Quantity must be a non-negative integer');
    }

    const now = new Date().toISOString();

    this.db.exec('BEGIN');
    try {
      const created = this.productRepo.create({
        name: trimmedName,
        price: priceCents,
        quantity: numQty,
        createdAt: now,
        updatedAt: now
      });

      if (numQty > 0) {
        this.movementRepo.create({
          productId: created.id,
          type: 'INITIAL',
          quantity: numQty,
          previousQuantity: 0,
          newQuantity: numQty,
          reason: 'Initial inventory on product creation',
          createdAt: now
        });
      }

      this.db.exec('COMMIT');
      return this._formatProduct(created);
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  getProducts(filters = {}) {
    const query = {};
    if (filters.search) query.search = filters.search;
    if (filters.minPrice !== undefined && filters.minPrice !== '') {
      const min = Number(filters.minPrice);
      if (!isNaN(min) && min >= 0) query.minPrice = Math.round(min * 100);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      const max = Number(filters.maxPrice);
      if (!isNaN(max) && max >= 0) query.maxPrice = Math.round(max * 100);
    }
    if (filters.lowStockOnly === true || filters.lowStockOnly === 'true' || filters.lowStockOnly === '1') {
      query.lowStockOnly = true;
    }

    const products = this.productRepo.findAll(query);
    return products.map((p) => this._formatProduct(p));
  }

  getProductById(id) {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      throw new BadRequestError('Invalid product ID');
    }

    const product = this.productRepo.findById(numId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return this._formatProduct(product);
  }

  updateProduct(id, { name, price }) {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      throw new BadRequestError('Invalid product ID');
    }

    const existing = this.productRepo.findById(numId);
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        throw new BadRequestError('Product name cannot be empty');
      }
      const trimmed = name.trim();
      if (trimmed.length > 200) {
        throw new BadRequestError('Product name must not exceed 200 characters');
      }
      updates.name = trimmed;
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        throw new BadRequestError('Price must be a non-negative number');
      }
      updates.price = Math.round(numPrice * 100);
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('At least one field (name or price) must be provided for update');
    }

    updates.updatedAt = new Date().toISOString();
    const updated = this.productRepo.update(numId, updates);
    return this._formatProduct(updated);
  }

  deleteProduct(id) {
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      throw new BadRequestError('Invalid product ID');
    }

    const existing = this.productRepo.findById(numId);
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    const deleted = this.productRepo.delete(numId);
    return { success: deleted, message: 'Product successfully deleted' };
  }
}

module.exports = ProductService;
