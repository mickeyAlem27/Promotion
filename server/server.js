const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const ErrorResponse = require('./utils/errorResponse');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS with options
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(cookieParser(process.env.JWT_SECRET));

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  family: 4,
  dbName: 'PROMOTION',
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 15000,
  w: 'majority',
  retryWrites: true,
  retryReads: true,
  autoIndex: false,
  tls: true,
  tlsAllowInvalidCertificates: false,
  authSource: 'admin'
};

// Enable Mongoose debug mode in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    console.log(`Mongoose: ${collectionName}.${method}`, JSON.stringify(query), doc);
  });
}

// Get the default connection
const db = mongoose.connection;

// Event listeners for better debugging
db.on('connecting', () => {
  console.log('🔄 Connecting to MongoDB...');
});

db.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database name:', db.name);
  console.log('📡 Connection host:', db.host);
  console.log('🔌 Connection port:', db.port);
});

db.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  if (err.name === 'MongoServerError') {
    console.error('MongoDB Server Error:', err.message);
  } else if (err.name === 'MongooseServerSelectionError') {
    console.error('MongoDB Server Selection Error:', err.message);
    console.error('This usually means the MongoDB server is not running or the connection string is incorrect');
  }
});

db.on('disconnected', () => {
  console.log('ℹ️ MongoDB disconnected');
});

// Connect to MongoDB with enhanced options and retry logic
const connectWithRetry = async (retryCount = 0) => {
  const maxRetries = 10;
  const baseDelay = 2000;
  const maxDelay = 30000;
  
  try {
    console.log(`🔗 Attempting to connect to MongoDB (Attempt ${retryCount + 1}/${maxRetries})...`);
    
    // Remove any existing listeners to prevent duplicates
    mongoose.connection.removeAllListeners();
    
    // Add connection event listeners for better debugging
    mongoose.connection.on('connecting', () => {
      console.log('🔌 Connecting to MongoDB...');
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    // Connect to MongoDB with a timeout
    const connectPromise = mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 30000)
    );
    
    const conn = await Promise.race([connectPromise, timeoutPromise]);
    
    // Verify the connection
    console.log('✅ Successfully connected to MongoDB');
    console.log(`🛢️  Database: ${conn.connection.db.databaseName}`);
    console.log(`🌐 Host: ${conn.connection.host}:${conn.connection.port}`);
    
    // Handle collections setup
    await setupCollections(conn);
    
    return conn;
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    
    // Log specific error details
    if (error.name === 'MongoServerError') {
      console.error('🔍 MongoDB Server Error:', error.codeName, '-', error.message);
      if (error.code === 8000) {
        console.error('  - Authentication failed. Please check your username and password.');
      }
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('🔍 Connection Error:', error.message);
      console.error('  - This usually means the MongoDB server is not running or the connection string is incorrect');
      console.error('  - Please verify your MongoDB Atlas connection string in .env');
      console.error('  - Make sure your IP is whitelisted in MongoDB Atlas');
      console.error('  - Check if your network allows outbound connections to MongoDB Atlas');
    } else if (error.message === 'Connection timeout') {
      console.error('⏱️  Connection attempt timed out');
    }
    
    // Only retry if we haven't exceeded max retries
    if (retryCount < maxRetries - 1) {
      const delay = Math.min(
        Math.pow(2, retryCount) * baseDelay + Math.random() * 1000,
        maxDelay
      );
      
      console.log(`🔄 Retrying connection in ${Math.round(delay/1000)} seconds... (${retryCount + 2}/${maxRetries})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectWithRetry(retryCount + 1);
    } else {
      console.error('🚨 Maximum number of retries reached. Please check your MongoDB connection.');
      console.error('  1. Verify your connection string in .env is correct');
      console.error('  2. Check if your IP is whitelisted in MongoDB Atlas');
      console.error('  3. Verify your network allows outbound connections to MongoDB Atlas');
      console.error('  4. Check if your MongoDB Atlas cluster is running and accessible');
      process.exit(1);
    }
  }
};

// Setup required collections
const setupCollections = async (conn) => {
  try {
    const collections = await conn.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('📋 Available collections:', collectionNames);
    
    // Check if required collections exist
    const requiredCollections = ['users', 'messages', 'conversations'];
    const missingCollections = requiredCollections.filter(c => !collectionNames.includes(c));
    
    if (missingCollections.length > 0) {
      console.warn('⚠️  Missing collections:', missingCollections);
      
      // Create missing collections if they don't exist
      const db = conn.connection.db;
      for (const collName of missingCollections) {
        try {
          await db.createCollection(collName);
          console.log(`✅ Created collection: ${collName}`);
        } catch (createErr) {
          console.warn(`⚠️  Could not create collection ${collName}:`, createErr.message);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not set up collections:', error.message);
    // Continue even if we can't set up collections
  }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Simple health check route
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Promotion API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Handle 404 - Route not found
app.use((req, res, next) => {
  next(new ErrorResponse(`Not Found - ${req.originalUrl}`, 404));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized';
    error = new ErrorResponse(message, 401);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Session expired, please log in again';
    error = new ErrorResponse(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
});

// Main server startup function
const startServer = async () => {
  try {
    // First connect to MongoDB
    await connectWithRetry();
    
    // Port configuration
    const PORT = parseInt(process.env.PORT, 10) || 5000;
    const HOST = '0.0.0.0';
    
    // Kill any process using the port
    const killPortProcess = () => {
      return new Promise((resolve) => {
        const { exec } = require('child_process');
        const isWindows = process.platform === 'win32';
        const command = isWindows
          ? `netstat -ano | findstr :${PORT}`
          : `lsof -i :${PORT} | grep LISTEN`;

        exec(command, (err, stdout) => {
          if (stdout) {
            const processId = isWindows
              ? stdout.trim().split(/\s+/).pop()
              : stdout.trim().split(/\s+/)[1];
            
            if (processId && parseInt(processId) !== process.pid) {
              console.log(`Killing process ${processId} on port ${PORT}...`);
              try {
                process.kill(processId, 'SIGTERM');
              } catch (killErr) {
                console.warn(`Could not kill process ${processId}:`, killErr.message);
              }
            } else {
              console.log(`Port ${PORT} is in use by this process; skipping kill.`);
            }
          }
          resolve();
        });
      });
    };
    
    // Kill any existing process on the port
    await killPortProcess();
    
    // Start the HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on http://${HOST}:${PORT}`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please free the port and try again.`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
    
    // Handle process termination
    const shutdown = async () => {
      console.log('\nShutting down server...');
      server.close(() => {
        console.log('Server stopped');
        process.exit(0);
      });
      
      // Force close after 5 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 5000);
    };
    
    // Handle process termination signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
    
    return server;
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(error => {
  console.error('Fatal error during server startup:', error);
  process.exit(1);
});