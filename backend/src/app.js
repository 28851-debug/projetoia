const express = require('express');
const cors = require('cors');
const path = require('node:path');
const createRouter = require('./routes/productRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

function createApp(services = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const frontendDir = path.join(__dirname, '..', '..', 'frontend');
  app.use(express.static(frontendDir));

  const apiRouter = createRouter(services);
  // Keep the documented /api prefix and also expose the required bare REST routes.
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
  });

  app.use('/api/*', notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
