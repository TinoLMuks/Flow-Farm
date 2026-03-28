const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./src/config/db');
const apiRoutes = require('./src/routes');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// 404 and error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server after verifying DB connection
testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is active on port ${PORT}`);
  });
});
