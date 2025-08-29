# ChatApp Server - Structured Architecture

A real-time chat application server built with Node.js, Express, Socket.IO, and MongoDB.

## 🏗️ Project Structure

```
server/
├── config/                 # Configuration files
│   ├── config.js          # Main configuration
│   └── database.js        # Database connection
├── middleware/            # Custom middleware
│   ├── auth.js           # Authentication middleware
│   └── errorHandler.js   # Error handling middleware
├── models/               # Database models
│   ├── User.js          # User model
│   ├── Message.js       # Message model
│   └── Group.js         # Group model
├── routes/               # API routes
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User management routes
│   ├── messages.js      # Message routes
│   └── groups.js        # Group management routes
├── socket/               # Socket.IO handlers
│   ├── index.js         # Main socket setup
│   ├── messageHandler.js # Message socket handlers
│   └── callHandler.js   # WebRTC call handlers
├── app.js               # Express app setup
├── server.js            # Server entry point
├── package.json         # Dependencies
└── env.example          # Environment variables example
```

## 🚀 Features

- **Real-time Messaging**: Socket.IO for instant message delivery
- **User Authentication**: JWT-based authentication
- **Group Chats**: Create and manage group conversations
- **Voice Messages**: Record and send voice messages
- **WebRTC Calls**: Voice and video calling capabilities
- **User Management**: Profile updates, user search
- **Error Handling**: Comprehensive error management
- **Database Indexing**: Optimized queries with MongoDB indexes

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/chatApp

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - Get all users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users

### Messages
- `GET /api/messages/private/:userId` - Get private messages
- `GET /api/messages/group/:groupId` - Get group messages
- `GET /api/messages/conversations` - Get recent conversations

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:groupId` - Get specific group
- `PUT /api/groups/:groupId` - Update group
- `DELETE /api/groups/:groupId/members/:memberId` - Remove member
- `POST /api/groups/:groupId/members` - Add member

## 🔌 Socket.IO Events

### Message Events
- `join` - Join user room
- `join group` - Join group room
- `leave group` - Leave group room
- `private message` - Send private message
- `group message` - Send group message
- `typing` - User typing indicator
- `stop typing` - Stop typing indicator

### WebRTC Call Events
- `call user` - Initiate call
- `answer call` - Answer incoming call
- `call declined` - Decline call
- `end call` - End active call
- `ice candidate` - WebRTC ICE candidate

## 🗄️ Database Models

### User Model
```javascript
{
  username: String (required, unique),
  password: String (required, hashed),
  avatar: String,
  online: Boolean,
  lastSeen: Date,
  timestamps: true
}
```

### Message Model
```javascript
{
  sender: ObjectId (ref: User, required),
  receiver: ObjectId (ref: User),
  group: ObjectId (ref: Group),
  content: String (required),
  type: String (enum: ['text', 'voice', 'image', 'file']),
  timestamp: Date,
  timestamps: true
}
```

### Group Model
```javascript
{
  name: String (required),
  avatar: String,
  admin: ObjectId (ref: User, required),
  members: [ObjectId] (ref: User),
  description: String,
  createdAt: Date,
  timestamps: true
}
```

## 🛠️ Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Code Structure Benefits
- **Modularity**: Each feature is in its own module
- **Maintainability**: Easy to find and modify specific functionality
- **Scalability**: Easy to add new features and routes
- **Testing**: Modular structure makes unit testing easier
- **Error Handling**: Centralized error management
- **Configuration**: Environment-based configuration

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Stateless authentication
- **Input Validation**: Request validation and sanitization
- **CORS Protection**: Configurable CORS settings
- **Error Handling**: Secure error responses

## 📊 Performance Optimizations

- **Database Indexing**: Optimized MongoDB queries
- **Connection Pooling**: Efficient database connections
- **Message Limiting**: Limit message history retrieval
- **Socket Room Management**: Efficient real-time communication

## 🚀 Deployment

1. **Set production environment variables**
2. **Ensure MongoDB is running**
3. **Start the server**: `npm start`
4. **Monitor logs** for any issues

## 🤝 Contributing

1. Follow the modular structure
2. Add proper error handling
3. Include input validation
4. Update documentation
5. Test thoroughly

## 📝 License

MIT License - see LICENSE file for details
