const path = require('path');

// Environment variables with defaults
const config = {
  // Server Configuration
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Database Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
    }
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  
  // Socket.IO Configuration
  socket: {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN ? process.env.SOCKET_CORS_ORIGIN.split(',') : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    uploadPath: path.join(__dirname, '..', 'uploads'),
    maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 5
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    maxSize: '20m',
    colorize: process.env.NODE_ENV === 'development'
  },
  
  // Redis Configuration (for session storage, caching, etc.)
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'chatapp:',
    ttl: parseInt(process.env.REDIS_TTL) || 3600 // 1 hour
  },
  
  // Email Configuration (for notifications, password reset, etc.)
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    from: process.env.EMAIL_FROM || 'noreply@chatapp.com'
  },
  
  // Push Notifications Configuration
  pushNotifications: {
    enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
    vapidKeys: {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
      subject: process.env.VAPID_SUBJECT || 'mailto:admin@chatapp.com'
    }
  },
  
  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    csrfProtection: process.env.CSRF_PROTECTION === 'true',
    helmetConfig: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false
    }
  },
  
  // Feature Flags
  features: {
    voiceMessages: process.env.FEATURE_VOICE_MESSAGES !== 'false',
    videoCalls: process.env.FEATURE_VIDEO_CALLS !== 'false',
    fileSharing: process.env.FEATURE_FILE_SHARING !== 'false',
    messageReactions: process.env.FEATURE_MESSAGE_REACTIONS !== 'false',
    messageForwarding: process.env.FEATURE_MESSAGE_FORWARDING !== 'false',
    groupCalls: process.env.FEATURE_GROUP_CALLS !== 'false',
    onlineStatus: process.env.FEATURE_ONLINE_STATUS !== 'false',
    typingIndicators: process.env.FEATURE_TYPING_INDICATORS !== 'false'
  },
  
  // Monitoring and Analytics
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    apiKey: process.env.MONITORING_API_KEY,
    endpoint: process.env.MONITORING_ENDPOINT,
    sampleRate: parseFloat(process.env.MONITORING_SAMPLE_RATE) || 1.0
  }
};

// Validation function
const validateConfig = () => {
  const requiredEnvVars = [];
  
  if (config.nodeEnv === 'production') {
    requiredEnvVars.push(
      'JWT_SECRET',
      'MONGODB_URI',
      'SESSION_SECRET'
    );
  }
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT secret strength
  if (config.jwt.secret.length < 32) {
    console.warn('⚠️  JWT secret should be at least 32 characters long');
  }
  
  // Validate database connection string
  if (!config.mongodb.uri.startsWith('mongodb')) {
    throw new Error('Invalid MongoDB URI');
  }
  
  console.log('✅ Configuration validation passed');
};

// Export configuration
module.exports = {
  ...config,
  validateConfig,
  isDevelopment: config.nodeEnv === 'development',
  isProduction: config.nodeEnv === 'production',
  isTest: config.nodeEnv === 'test'
};