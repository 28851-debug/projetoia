const { getDatabase } = require('../config/database');

class ProductRepository {
  constructor(db = null) {
    this._db = db;
  }

  get db() {
    return this._db || getDatabase();
  }

  create({ name, price, quantity, createdAt, updatedAt }) {
    const stmt = this.db.prepare(`
      INSERT INTO products (name, price, quantity, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, price, quantity, createdAt, updatedAt);
    return this.findById(Number(info.lastInsertRowid));
  }

  findById(id) {
    const stmt = this.db.prepare(`
      SELECT id, name, price, quantity, createdAt, updatedAt
      FROM products
      WHERE id = ?
    `);
    const product = stmt.get(id);
    return product || null;
  }

  findAll({ search, minPrice, maxPrice, lowStockOnly, lowStockThreshold = 10 } = {}) {
    let sql = 'SELECT id, name, price, quantity, createdAt, updatedAt FROM products WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      sql += ' AND name LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    if (minPrice !== undefined && minPrice !== null) {
      sql += ' AND price >= ?';
      params.push(minPrice);
    }

    if (maxPrice !== undefined && maxPrice !== null) {
      sql += ' AND price <= ?';
      params.push(maxPrice);
    }

    if (lowStockOnly) {
      sql += ' AND quantity <= ?';
      params.push(lowStockThreshold);
    }

    sql += ' ORDER BY id DESC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  update(id, { name, price, updatedAt }) {
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }

    updates.push('updatedAt = ?');
    params.push(updatedAt);

    params.push(id);

    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...params);
    if (info.changes === 0) return null;
    return this.findById(id);
  }

  updateQuantity(id, newQuantity, updatedAt) {
    const stmt = this.db.prepare(`
      UPDATE products
      SET quantity = ?, updatedAt = ?
      WHERE id = ?
    `);
    const info = stmt.run(newQuantity, updatedAt, id);
    if (info.changes === 0) return null;
    return this.findById(id);
  }

  delete(id) {
    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  getDashboardStats(lowStockThreshold = 10) {
    const statsStmt = this.db.prepare(`
      SELECT
        COUNT(*) as totalProducts,
        COALESCE(SUM(quantity), 0) as totalStockUnits,
        COALESCE(SUM(CASE WHEN quantity <= ? THEN 1 ELSE 0 END), 0) as lowStockCount,
        COALESCE(SUM(CAST(price AS REAL) * quantity), 0) as totalInventoryValueCents
      FROM products
    `);
    return statsStmt.get(lowStockThreshold);
  }
}

module.exports = ProductRepository;
