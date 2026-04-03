const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/env');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const ApiError = require('./utils/ApiError');

const app = express();

// ----- Security Middleware -----
app.use(helmet()); // Set security HTTP headers
app.use(cors()); // Enable CORS
app.use(mongoSanitize()); // Sanitize data against NoSQL injection
app.use(hpp()); // Prevent HTTP parameter pollution

// ----- Body Parsing -----
app.use(express.json({ limit: '10kb' })); // Body limit to prevent abuse
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ----- Logging -----
if (config.node_env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ----- Rate Limiting -----
app.use('/api', apiLimiter);

// ----- API Documentation -----
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Finance Dashboard API Docs',
}));

// ----- Health Check -----
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance Dashboard API is running',
    environment: config.node_env,
    timestamp: new Date().toISOString(),
  });
});

// ----- API Routes -----
app.use('/api', routes);

// ----- 404 Handler -----
app.all('*', (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl}`));
});

// ----- Global Error Handler -----
app.use(errorHandler);

module.exports = app;
