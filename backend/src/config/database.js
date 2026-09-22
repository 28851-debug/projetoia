const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

function initializeSchema(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      quantity INTEGER NOT NULL CHECK (quantity >= 0),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('INITIAL', 'ADD', 'REMOVE')),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      previousQuantity INTEGER NOT NULL,
      newQuantity INTEGER NOT NULL,
      reason TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_movements_productId ON inventory_movements(productId);
  `);
}

function createDatabase(customPath) {
  const dbPath = customPath || process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'inventory.db');
  
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }

  initializeSchema(db);
  return db;
}

let defaultDb = null;

function getDatabase() {
  if (!defaultDb) {
    defaultDb = createDatabase();
  }
  return defaultDb;
}

function closeDatabase() {
  if (defaultDb) {
    defaultDb.close();
    defaultDb = null;
  }
}

module.exports = {
  createDatabase,
  getDatabase,
  closeDatabase,
  initializeSchema
};
