const express = require('express');
const cors = require('cors');
const path = require('node:path');
const createRouter = require('./routes/productRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

function createApp(services = {}) {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());

  // Serve frontend static assets
  const frontendDir = path.join(__dirname, '..', '..', 'frontend');
  app.use(express.static(frontendDir));

  // Mount API routes
  const apiRouter = createRouter(services);
  app.use('/api', apiRouter);

  // Serve index.html for root if not matched
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
  });

  // 404 handler for API routes
  app.use('/api/*', notFoundHandler);

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
