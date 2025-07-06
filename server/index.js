const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const conversationRouter = require('./routes/conversation');
require('dotenv').config();

// Set Google Cloud credentials
if (process.env.GOOGLE_CLOUD_KEY_FILE && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_CLOUD_KEY_FILE;
}

// Debug: Check if credentials are set
console.log('Key file exists:', fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS));

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.googleapis.com", "https://speech.googleapis.com", "https://texttospeech.googleapis.com"],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please wait a moment before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'API rate limit exceeded',
    message: 'Please wait a moment before making more requests.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use('/conversation', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists for fallback local storage
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Expose uploads directory for TTS audio (fallback when cloud storage fails)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'VIBE AI Companion API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check with detailed status
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'VIBE AI Companion API',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    services: {
      googleCloud: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      gemini: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      firebase: !!process.env.FIREBASE_PROJECT_ID,
      cloudStorage: !!process.env.GOOGLE_CLOUD_STORAGE_BUCKET
    }
  };
  
  res.json(health);
});

// Socket.io connection handling with error handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Handle chat messages with error handling
  socket.on('chat_message', async (data) => {
    try {
      console.log('Chat message received:', data);
      // TODO: Process message with AI and respond
      socket.emit('chat_response', {
        id: Date.now(),
        type: 'bot',
        content: 'Hello! I am VIBE, your AI companion. How can I help you today?',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing chat message:', error);
      socket.emit('chat_error', {
        error: 'Failed to process message',
        message: 'Please try again.'
      });
    }
  });
});

app.use('/conversation', conversationRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The requested path ${req.originalUrl} does not exist.`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /conversation/text',
      'POST /conversation/voice',
      'GET /conversation/history'
    ]
  });
});

// Comprehensive error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Determine error type and provide appropriate response
  let statusCode = 500;
  let errorMessage = 'Something went wrong!';
  let userMessage = 'An unexpected error occurred. Please try again.';
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation Error';
    userMessage = 'Please check your input and try again.';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Unauthorized';
    userMessage = 'Please sign in to continue.';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    errorMessage = 'File Upload Error';
    userMessage = 'Please check your file and try again.';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 503;
    errorMessage = 'Service Unavailable';
    userMessage = 'External service is temporarily unavailable.';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorMessage = 'Connection Refused';
    userMessage = 'Unable to connect to external service.';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 408;
    errorMessage = 'Request Timeout';
    userMessage = 'Request timed out. Please try again.';
  }
  
  // Log error details
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };
  
  console.error('Error details:', errorLog);
  
  // Send error response
  res.status(statusCode).json({ 
    error: errorMessage,
    message: process.env.NODE_ENV === 'development' ? err.message : userMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('Uncaught Exception');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 VIBE AI Companion Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️  Security: Helmet enabled`);
  console.log(`⚡ Compression: Enabled`);
  console.log(`🚦 Rate limiting: Enabled`);
}); 