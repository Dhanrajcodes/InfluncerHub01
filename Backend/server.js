import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import influencerRoutes from './routes/influencers.js';
import brandRoutes from './routes/brands.js';
import sponsorshipRoutes from './routes/sponsorships.js';
import categoryRoutes from './routes/categories.js';
import uploadRoutes from './routes/upload.js';
import messageRoutes from './routes/messages.js';
import analyticsRoutes from './routes/analytics.js';
import earningsRoutes from './routes/earnings.js';

// Import middleware
import { errorHandler } from './middleware/errorMiddleware.js';

// Import WebSocket server
import { createServer } from 'http';
import { initializeWebSocketServer } from './utils/websocketServer.js';

// Import models to ensure they are registered
import './models/User.js';
import './models/InfluencerProfile.js';
import './models/BrandProfile.js';
import './models/Sponsorship.js';
import './models/Category.js';
import './models/Message.js';
import './models/MessageRequest.js';
import './models/UserConnection.js';

const app = express();
const server = createServer(app);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 5000);

const getAllowedOrigins = () => {
  const configuredOrigins = (process.env.CLIENT_ORIGIN || process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = [
    'https://influncerhub.vercel.app',
    'http://localhost:3000',
  ];

  return new Set([...defaultOrigins, ...configuredOrigins]);
};

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (health checks, curl) with no origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
};

// Initialize WebSocket server
initializeWebSocketServer(server);

// Middleware
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/sponsorships', sponsorshipRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/earnings', earningsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Error handling middleware
app.use(errorHandler);

const getMongoUri = () => {
  const rawValue = (process.env.MONGO_URI || '').trim();

  if (!rawValue) {
    return 'mongodb://127.0.0.1:27017/influencerhub';
  }

  // If Render injects host:port, normalize it into a proper mongodb URI.
  if (!rawValue.startsWith('mongodb://') && !rawValue.startsWith('mongodb+srv://')) {
    return `mongodb://${rawValue}/influencerhub`;
  }

  return rawValue;
};

let shuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('Graceful shutdown timed out; forcing exit');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  if (!shuttingDown) {
    console.warn('MongoDB disconnected');
  }
});

const startServer = async () => {
  try {
    await mongoose.connect(getMongoUri());
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

startServer();

export default app;
