const ProductRepository = require('../repositories/productRepository');
const MovementRepository = require('../repositories/movementRepository');
const { getDatabase } = require('../config/database');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/errors');

class InventoryService {
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

  addStock(productId, quantity, reason = null) {
    const numId = Number(productId);
    if (!Number.isInteger(numId) || numId <= 0) {
      throw new BadRequestError('Invalid product ID');
    }

    const numQty = Number(quantity);
    if (!Number.isInteger(numQty) || numQty <= 0) {
      throw new BadRequestError('Quantity to add must be an integer greater than zero');
    }

    this.db.exec('BEGIN');
    try {
      const product = this.productRepo.findById(numId);
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      const previousQuantity = product.quantity;
      const newQuantity = previousQuantity + numQty;
      const now = new Date().toISOString();

      const updatedProduct = this.productRepo.updateQuantity(numId, newQuantity, now);

      this.movementRepo.create({
        productId: numId,
        type: 'ADD',
        quantity: numQty,
        previousQuantity,
        newQuantity,
        reason: reason ? String(reason).trim() : null,
        createdAt: now
      });

      this.db.exec('COMMIT');

      return {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: Number((updatedProduct.price / 100).toFixed(2)),
        quantity: updatedProduct.quantity,
        previousQuantity,
        added: numQty,
        isLowStock: updatedProduct.quantity <= 10,
        updatedAt: updatedProduct.updatedAt
      };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  removeStock(productId, quantity, reason = null) {
    const numId = Number(productId);
    if (!Number.isInteger(numId) || numId <= 0) {
      throw new BadRequestError('Invalid product ID');
    }

    const numQty = Number(quantity);
    if (!Number.isInteger(numQty) || numQty <= 0) {
      throw new BadRequestError('Quantity to remove must be an integer greater than zero');
    }

    this.db.exec('BEGIN');
    try {
      const product = this.productRepo.findById(numId);
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      const previousQuantity = product.quantity;
      if (previousQuantity < numQty) {
        throw new ConflictError(
          `Cannot remove ${numQty} units. Only ${previousQuantity} units are currently available.`
        );
      }

      const newQuantity = previousQuantity - numQty;
      const now = new Date().toISOString();

      const updatedProduct = this.productRepo.updateQuantity(numId, newQuantity, now);

      this.movementRepo.create({
        productId: numId,
        type: 'REMOVE',
        quantity: numQty,
        previousQuantity,
        newQuantity,
        reason: reason ? String(reason).trim() : null,
        createdAt: now
      });

      this.db.exec('COMMIT');

      return {
        id: updatedProduct.id,
        name: updatedProduct.name,
        price: Number((updatedProduct.price / 100).toFixed(2)),
        quantity: updatedProduct.quantity,
        previousQuantity,
        removed: numQty,
        isLowStock: updatedProduct.quantity <= 10,
        updatedAt: updatedProduct.updatedAt
      };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  getProductMovements(productId) {
    const numId = Number(productId);
    if (!Number.isInteger(numId) || numId <= 0) {
      throw new BadRequestError('Invalid product ID');
    }

    const product = this.productRepo.findById(numId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return this.movementRepo.findByProductId(numId);
  }

  getDashboardStats() {
    const stats = this.productRepo.getDashboardStats();
    return {
      totalProducts: Number(stats.totalProducts) || 0,
      totalStockUnits: Number(stats.totalStockUnits) || 0,
      lowStockCount: Number(stats.lowStockCount) || 0,
      totalInventoryValue: Number(((stats.totalInventoryValueCents || 0) / 100).toFixed(2))
    };
  }
}

module.exports = InventoryService;
