const InventoryService = require('../services/inventoryService');

class InventoryController {
  constructor(inventoryService = null) {
    this.inventoryService = inventoryService || new InventoryService();
  }

  addStock = (req, res, next) => {
    try {
      const { id } = req.params;
      const { quantity, reason } = req.body;
      const result = this.inventoryService.addStock(id, quantity, reason);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  removeStock = (req, res, next) => {
    try {
      const { id } = req.params;
      const { quantity, reason } = req.body;
      const result = this.inventoryService.removeStock(id, quantity, reason);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  getMovements = (req, res, next) => {
    try {
      const { id } = req.params;
      const movements = this.inventoryService.getProductMovements(id);
      return res.status(200).json(movements);
    } catch (err) {
      next(err);
    }
  };

  getStats = (req, res, next) => {
    try {
      const stats = this.inventoryService.getDashboardStats();
      return res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = InventoryController;
