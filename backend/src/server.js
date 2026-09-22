const createApp = require('./app');
const { closeDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[Inventory Management System] Server running on http://localhost:${PORT}`);
  console.log(`[Inventory Management System] Access web frontend at http://localhost:${PORT}`);
  console.log(`[Inventory Management System] API base URL: http://localhost:${PORT}/api`);
});

function gracefulShutdown() {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    closeDatabase();
    console.log('Server and database closed. Bye!');
    process.exit(0);
  });
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = server;
