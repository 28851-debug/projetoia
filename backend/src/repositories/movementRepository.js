const { getDatabase } = require('../config/database');

class MovementRepository {
  constructor(db = null) {
    this._db = db;
  }

  get db() {
    return this._db || getDatabase();
  }

  create({ productId, type, quantity, previousQuantity, newQuantity, reason, createdAt }) {
    const stmt = this.db.prepare(`
      INSERT INTO inventory_movements (
        productId, type, quantity, previousQuantity, newQuantity, reason, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      productId,
      type,
      quantity,
      previousQuantity,
      newQuantity,
      reason || null,
      createdAt
    );
    return this.findById(Number(info.lastInsertRowid));
  }

  findById(id) {
    const stmt = this.db.prepare(`
      SELECT id, productId, type, quantity, previousQuantity, newQuantity, reason, createdAt
      FROM inventory_movements
      WHERE id = ?
    `);
    return stmt.get(id) || null;
  }

  findByProductId(productId) {
    const stmt = this.db.prepare(`
      SELECT id, productId, type, quantity, previousQuantity, newQuantity, reason, createdAt
      FROM inventory_movements
      WHERE productId = ?
      ORDER BY id DESC
    `);
    return stmt.all(productId);
  }

  findRecent(limit = 20) {
    const stmt = this.db.prepare(`
      SELECT m.id, m.productId, p.name as productName, m.type, m.quantity,
             m.previousQuantity, m.newQuantity, m.reason, m.createdAt
      FROM inventory_movements m
      JOIN products p ON p.id = m.productId
      ORDER BY m.id DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
}

module.exports = MovementRepository;
