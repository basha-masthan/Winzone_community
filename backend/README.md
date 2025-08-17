# Winzone Arena Backend

A complete Node.js backend API for the Winzone Arena gaming tournament application.

## 🚀 Features

- **User Management**: Registration, authentication, profile management
- **Game Management**: CRUD operations for games
- **Tournament System**: Create, manage, and track tournaments
- **Payment Integration**: Razorpay for deposits and withdrawals
- **Image Upload**: Cloudinary integration for profile pictures and screenshots
- **Admin Dashboard**: Complete admin panel for managing the application
- **Real-time Updates**: Automatic tournament status updates
- **CSV Import**: Bulk tournament results import
- **Content Moderation**: Post approval and moderation system

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **File Upload**: Multer + Cloudinary
- **Payment**: Razorpay
- **Email**: Nodemailer
- **Validation**: Custom middleware

## 📋 Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB database
- Cloudinary account
- Razorpay account
- Gmail account for SMTP

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd winzone_arena/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   Edit `.env` file with your credentials:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGO_URI=mongodb+srv://basha:king@freefire.lrfkfsu.mongodb.net/Flutter-winzone?retryWrites=true&w=majority&appName=FreeFire

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=30d

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=drfy6umhn
   CLOUDINARY_API_KEY=596969782927433
   CLOUDINARY_API_SECRET=vNww_xC7wuPrrNnawtNEuJSog3E

   # Razorpay Configuration
   RAZORPAY_KEY_ID=rzp_live_GcrlJ48mEqrbHu
   RAZORPAY_KEY_SECRET=yosO5yOJhCnYSyn7oQUniaZz

   # SMTP Configuration
   SMTP_EMAIL=kingkite789@gmail.com
   SMTP_PASS=dykm hdhj zlqw kijq

   # App Configuration
   APP_NAME=Winzone Arena
   APP_URL=http://localhost:5000
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google sign-in
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/:userId` - Update user profile
- `PATCH /api/users/:userId/balance` - Update user balance
- `GET /api/users/leaderboard/global` - Get global leaderboard
- `GET /api/users/search/query` - Search users

### Games
- `GET /api/games` - Get all games
- `GET /api/games/:gameId` - Get game by ID
- `GET /api/games/search/query` - Search games

### Tournaments
- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:tournamentId` - Get tournament by ID
- `POST /api/tournaments/:tournamentId/register` - Register for tournament
- `DELETE /api/tournaments/:tournamentId/register` - Unregister from tournament
- `GET /api/tournaments/:tournamentId/leaderboard` - Get tournament leaderboard
- `PUT /api/tournaments/:tournamentId/results` - Submit tournament results

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:postId` - Get post by ID
- `PUT /api/posts/:postId` - Update post
- `DELETE /api/posts/:postId` - Delete post
- `POST /api/posts/:postId/like` - Like post
- `DELETE /api/posts/:postId/like` - Unlike post
- `POST /api/posts/:postId/comments` - Add comment

### Transactions
- `GET /api/transactions/user/:userId` - Get user transactions
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/:transactionId/status` - Update transaction status

### Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `DELETE /api/upload/image/:publicId` - Delete image

### Admin (Protected)
- `GET /api/admin/dashboard-stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:userId` - Update user
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/games` - Get all games
- `POST /api/admin/games` - Create game
- `PUT /api/admin/games/:gameId` - Update game
- `DELETE /api/admin/games/:gameId` - Delete game
- `GET /api/admin/tournaments` - Get all tournaments
- `POST /api/admin/tournaments` - Create tournament
- `PUT /api/admin/tournaments/:tournamentId` - Update tournament
- `DELETE /api/admin/tournaments/:tournamentId` - Delete tournament
- `GET /api/admin/withdrawals` - Get withdrawal requests
- `PUT /api/admin/withdrawals/:withdrawalId/approve` - Approve withdrawal
- `PUT /api/admin/withdrawals/:withdrawalId/reject` - Reject withdrawal
- `PUT /api/admin/withdrawals/:withdrawalId/process` - Process withdrawal

## 🖥️ Admin Dashboard

Access the admin dashboard at: `http://localhost:5000/admin-dashboard`

**Features:**
- User management (CRUD operations)
- Game management
- Tournament creation and management
- Withdrawal request processing
- Content moderation
- Transaction monitoring
- Dashboard statistics
- CSV bulk import for tournament results

## 📊 Database Models

### User
- Basic info (name, email, phone)
- Gaming stats (matches, wins, kills)
- Financial data (balance, winnings)
- Game IDs for different games

### Game
- Name, image, description
- Tournament count tracking
- Active/inactive status

### Tournament
- Game details, entry fee, prize pool
- Registration management
- Status tracking (upcoming/ongoing/completed)
- Results and leaderboard

### TournamentRegistration
- User registration details
- Game ID and results
- Payment status tracking

### Post
- Community feed posts
- Likes and comments system
- Content moderation flags

### Transaction
- Financial transaction tracking
- Payment gateway integration
- Status management

### WithdrawalRequest
- User withdrawal requests
- Bank details and UPI
- Admin approval workflow

## 🔐 Authentication & Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Rate limiting protection
- CORS configuration

## 📁 Project Structure

```
backend/
├── models/                 # Database models
│   ├── User.js
│   ├── Game.js
│   ├── Tournament.js
│   ├── TournamentRegistration.js
│   ├── Post.js
│   ├── Transaction.js
│   └── WithdrawalRequest.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── users.js
│   ├── games.js
│   ├── tournaments.js
│   ├── posts.js
│   ├── transactions.js
│   ├── admin.js
│   └── upload.js
├── middleware/             # Custom middleware
│   └── auth.js
├── public/                 # Static files
│   ├── admin-dashboard.html
│   └── admin-dashboard.js
├── server.js              # Main server file
├── package.json           # Dependencies
└── README.md              # This file
```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Environment Variables
Make sure to set all required environment variables in your `.env` file.

## 📱 API Testing

### Using curl
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman
Import the API collection from the `postman` folder (if available).

## 🔧 Configuration

### MongoDB
- Ensure MongoDB is running and accessible
- Update `MONGO_URI` in `.env` file

### Cloudinary
- Create a Cloudinary account
- Update cloud name, API key, and secret in `.env`

### Razorpay
- Create a Razorpay account
- Update key ID and secret in `.env`

### SMTP
- Configure Gmail SMTP settings
- Update email and password in `.env`

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

2. **Cloudinary Upload Error**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper file format

3. **JWT Token Error**
   - Check `JWT_SECRET` in `.env`
   - Verify token expiration settings

4. **Port Already in Use**
   - Change `PORT` in `.env`
   - Kill existing process using the port

### Logs
Check console output for detailed error messages and debugging information.

## 📈 Performance

- Database indexing for optimal queries
- Connection pooling for MongoDB
- File size limits for uploads
- Rate limiting for API endpoints
- Efficient data pagination

## 🔒 Security Features

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- JWT token security

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Happy Gaming! 🎮**
