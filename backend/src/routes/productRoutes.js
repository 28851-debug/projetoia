const express = require('express');
const ProductController = require('../controllers/productController');
const InventoryController = require('../controllers/inventoryController');

function createRouter({ productService, inventoryService } = {}) {
  const router = express.Router();
  const productController = new ProductController(productService);
  const inventoryController = new InventoryController(inventoryService);

  // Dashboard stats
  router.get('/dashboard/stats', inventoryController.getStats);

  // Product CRUD
  router.get('/products', productController.list);
  router.post('/products', productController.create);
  router.get('/products/:id', productController.getById);
  router.put('/products/:id', productController.update);
  router.delete('/products/:id', productController.delete);

  // Stock operations
  router.post('/products/:id/stock', inventoryController.addStock);
  router.post('/products/:id/stock/remove', inventoryController.removeStock);
  router.get('/products/:id/movements', inventoryController.getMovements);

  return router;
}

module.exports = createRouter;
