require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  mongoURI: process.env.MONGODB_URI || 'mongodb+srv://sahalsemikolen4_db_user:lOE6t6NU1rOpGzJg@cluster0.gges5yz.mongodb.net/chatApp?retryWrites=true&w=majority&appName=Cluster0',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'https://chat-application-r9tn.vercel.app',
  
  // Socket.IO configuration
  socketCors: {
    origin: process.env.CORS_ORIGIN || 'https://chat-application-r9tn.vercel.app/',
    methods: ['GET', 'POST']
  }
};

module.exports = config;
