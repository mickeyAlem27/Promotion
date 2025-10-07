const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const ErrorResponse = require('./utils/errorResponse');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please create a .env file with the required variables.');
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
    files: 5 // Maximum 5 files at once
  }
});

// Serve uploaded files statically (before CORS to avoid blocking static files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add CORS headers specifically for uploaded files
app.use('/uploads', (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5176'];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5176'];

const corsOptions = {
  origin: allowedOrigins,
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

// Setup MongoDB connection event listeners
const setupMongooseListeners = () => {
  const db = mongoose.connection;
  
  db.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database name:', db.name);
    console.log('📡 Connection host:', db.host);
    console.log('🔌 Connection port:', db.port);
  });

  db.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  db.on('disconnected', () => {
    console.log('ℹ️ MongoDB disconnected');
  });

  db.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });
};

// Connect to MongoDB with enhanced options and retry logic
const connectWithRetry = async (retryCount = 0) => {
  const maxRetries = 10;
  const baseDelay = 2000;
  const maxDelay = 30000;
  
  try {
    console.log(`🔗 Attempting to connect to MongoDB (Attempt ${retryCount + 1}/${maxRetries})...`);
    
    // Setup event listeners only on first attempt
    if (retryCount === 0) {
      setupMongooseListeners();
    }
    
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
    const requiredCollections = ['users', 'messages', 'conversations', 'posts', 'jobs'];
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
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Return file information
    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };

    res.json({ success: true, data: fileInfo });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'File upload failed' });
  }
});

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
  // Log error details
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  let error = { ...err };
  error.message = err.message;

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
    // Skip MongoDB connection for now to test basic server functionality
    console.log('🚀 Starting server...');
    console.log('⚠️  Note: MongoDB connection will be attempted but server will continue if it fails');

    // Port configuration
    const PORT = parseInt(process.env.PORT, 10) || 5000;
    const HOST = '0.0.0.0';

    // Start the HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on http://${HOST}:${PORT}`);
      console.log('✅ Server started successfully!');
      console.log('📝 Note: Some features may not work without MongoDB connection');
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
      console.log('\n🛑 Shutting down server...');

      // Close HTTP server
      server.close(async () => {
        console.log('✅ HTTP server stopped');

        // Close MongoDB connection if it exists
        try {
          if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed');
          }
          process.exit(0);
        } catch (err) {
          console.error('❌ Error closing MongoDB connection:', err.message);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle process termination signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Try to connect to MongoDB in the background
    connectWithRetry().catch(error => {
      console.warn('⚠️  MongoDB connection failed, but server will continue running');
      console.warn('Some features (like authentication) may not work properly');
      console.warn('To fix this, please check your MongoDB connection string in .env');
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