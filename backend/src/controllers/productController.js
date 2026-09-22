const ProductService = require('../services/productService');

class ProductController {
  constructor(productService = null) {
    this.productService = productService || new ProductService();
  }

  create = (req, res, next) => {
    try {
      const { name, price, quantity } = req.body;
      const product = this.productService.createProduct({ name, price, quantity });
      return res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  };

  list = (req, res, next) => {
    try {
      const { search, minPrice, maxPrice, lowStockOnly } = req.query;
      const products = this.productService.getProducts({
        search,
        minPrice,
        maxPrice,
        lowStockOnly
      });
      return res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  };

  getById = (req, res, next) => {
    try {
      const { id } = req.params;
      const product = this.productService.getProductById(id);
      return res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  };

  update = (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, price } = req.body;
      const updated = this.productService.updateProduct(id, { name, price });
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  };

  delete = (req, res, next) => {
    try {
      const { id } = req.params;
      const result = this.productService.deleteProduct(id);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = ProductController;
