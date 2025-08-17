# Winzone Arena API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. Authentication APIs

### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "uid": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "balance": 0,
      "moneyWon": 0,
      "depositedAmount": 0,
      "gameIds": {},
      "registeredTournaments": [],
      "matchesPlayed": 0,
      "wins": 0,
      "totalKills": 0,
      "createdAt": "2024-08-16T18:30:00.000Z",
      "lastActive": "2024-08-16T18:30:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here"
  }
}
```

### Google Sign-In
```bash
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "google_id_token_here"
  }'
```

---

## 2. User Management APIs

### Get User Profile
```bash
curl -X GET http://localhost:5000/api/users/64f1a2b3c4d5e6f7g8h9i0j1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update User Profile
```bash
curl -X PUT http://localhost:5000/api/users/64f1a2b3c4d5e6f7g8h9i0j1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "phoneNumber": "+1234567890",
    "gameIds": {
      "PUBG": "PUBG123",
      "Free Fire": "FF456"
    }
  }'
```

### Update User Balance
```bash
curl -X PATCH http://localhost:5000/api/users/64f1a2b3c4d5e6f7g8h9i0j1/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 1000.50
  }'
```

### Get Leaderboard
```bash
curl -X GET "http://localhost:5000/api/leaderboard?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 3. Tournament APIs

### Get All Tournaments
```bash
curl -X GET "http://localhost:5000/api/tournaments?game=PUBG&type=paid&status=upcoming" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `game` (optional): Filter by game name
- `type` (optional): Filter by tournament type (paid/free)
- `status` (optional): Filter by status (upcoming/ongoing/completed/cancelled)

### Get Tournament by ID
```bash
curl -X GET http://localhost:5000/api/tournaments/64f1a2b3c4d5e6f7g8h9i0j1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Tournament (Admin Only)
```bash
curl -X POST http://localhost:5000/api/tournaments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "PUBG Championship 2024",
    "game": "PUBG",
    "type": "paid",
    "entryFee": 100.0,
    "prizePool": 10000.0,
    "totalSlots": 100,
    "dateTime": "2024-09-01T18:00:00.000Z",
    "description": "The ultimate PUBG tournament",
    "rules": ["No teaming", "No cheating"],
    "createdBy": "admin_user_id"
  }'
```

### Register for Tournament
```bash
curl -X POST http://localhost:5000/api/tournaments/64f1a2b3c4d5e6f7g8h9i0j1/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1"
  }'
```

### Unregister from Tournament
```bash
curl -X DELETE http://localhost:5000/api/tournaments/64f1a2b3c4d5e6f7g8h9i0j1/register/64f1a2b3c4d5e6f7g8h9i0j1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Search Tournaments
```bash
curl -X GET "http://localhost:5000/api/tournaments/search?q=PUBG" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4. Community Posts APIs

### Get Posts
```bash
curl -X GET "http://localhost:5000/api/posts?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Parameters:**
- `limit` (optional): Number of posts to return (default: 20)
- `offset` (optional): Number of posts to skip (default: 0)

### Create Post
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "userName": "John Doe",
    "content": "Just won my first tournament! 🏆",
    "imageUrl": "https://cloudinary.com/image.jpg",
    "postType": "gameplay"
  }'
```

### Like Post
```bash
curl -X POST http://localhost:5000/api/posts/64f1a2b3c4d5e6f7g8h9i0j1/like \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1"
  }'
```

### Unlike Post
```bash
curl -X DELETE http://localhost:5000/api/posts/64f1a2b3c4d5e6f7g8h9i0j1/like/64f1a2b3c4d5e6f7g8h9i0j1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add Comment
```bash
curl -X POST http://localhost:5000/api/posts/64f1a2b3c4d5e6f7g8h9i0j1/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "userName": "John Doe",
    "content": "Congratulations! 🎉"
  }'
```

---

## 5. Transaction & Payment APIs

### Get User Transactions
```bash
curl -X GET "http://localhost:5000/api/transactions?userId=64f1a2b3c4d5e6f7g8h9i0j1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Transaction
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "userName": "John Doe",
    "type": "deposit",
    "amount": 100.0,
    "status": "completed",
    "description": "Wallet recharge via Razorpay",
    "paymentMethod": "razorpay",
    "transactionId": "razorpay_txn_id"
  }'
```

### Update Transaction Status
```bash
curl -X PATCH http://localhost:5000/api/transactions/64f1a2b3c4d5e6f7g8h9i0j1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

---

## 6. Image Upload API

### Upload Image to Cloudinary
```bash
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "folder=winzone_arena"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/drfy6umhn/image/upload/v1234567890/winzone_arena/image.jpg",
    "publicId": "winzone_arena/image"
  }
}
```

---

## 7. Health Check API

### API Health Status
```bash
curl -X GET http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Winzone Arena API is running",
  "timestamp": "2024-08-16T18:30:00.000Z"
}
```

---

## Database Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "uid": "String (Firebase UID)",
  "name": "String",
  "email": "String",
  "phoneNumber": "String",
  "profilePicture": "String (URL)",
  "balance": "Number",
  "moneyWon": "Number",
  "depositedAmount": "Number",
  "gameIds": {
    "gameName": "gameId"
  },
  "registeredTournaments": ["tournamentId"],
  "matchesPlayed": "Number",
  "wins": "Number",
  "totalKills": "Number",
  "createdAt": "Date",
  "lastActive": "Date"
}
```

### Tournaments Collection
```json
{
  "_id": "ObjectId",
  "title": "String",
  "game": "String",
  "type": "String (paid/free)",
  "entryFee": "Number",
  "prizePool": "Number",
  "totalSlots": "Number",
  "registeredSlots": "Number",
  "dateTime": "Date",
  "description": "String",
  "rules": ["String"],
  "status": "String (upcoming/ongoing/completed/cancelled)",
  "registeredUsers": ["userId"],
  "results": {
    "userId": {
      "kills": "Number",
      "position": "Number",
      "prize": "Number"
    }
  },
  "createdAt": "Date",
  "createdBy": "String (userId)"
}
```

### Posts Collection
```json
{
  "_id": "ObjectId",
  "userId": "String",
  "userName": "String",
  "userProfilePicture": "String (URL)",
  "content": "String",
  "imageUrl": "String (URL)",
  "likes": ["userId"],
  "comments": [
    {
      "id": "String",
      "userId": "String",
      "userName": "String",
      "content": "String",
      "createdAt": "Date"
    }
  ],
  "createdAt": "Date",
  "postType": "String (text/image/meme/gameplay)"
}
```

### Transactions Collection
```json
{
  "_id": "ObjectId",
  "userId": "String",
  "userName": "String",
  "type": "String (deposit/withdrawal/entryFee/winning/refund)",
  "amount": "Number",
  "status": "String (pending/completed/failed/cancelled)",
  "description": "String",
  "tournamentId": "String",
  "paymentMethod": "String",
  "transactionId": "String",
  "createdAt": "Date",
  "completedAt": "Date",
  "adminNotes": "String"
}
```

---

## Admin Dashboard Requirements

### 1. Authentication & Authorization
- Admin login system
- JWT token management
- Role-based access control (Admin/Moderator)

### 2. User Management
- View all users
- Search and filter users
- Edit user details
- Ban/unban users
- View user statistics

### 3. Tournament Management
- Create new tournaments
- Edit existing tournaments
- View tournament registrations
- Manage tournament results
- Cancel tournaments

### 4. Content Moderation
- Review community posts
- Approve/reject posts
- Remove inappropriate content
- Manage user reports

### 5. Financial Management
- View all transactions
- Process withdrawal requests
- Generate financial reports
- Monitor payment status

### 6. Analytics Dashboard
- User growth statistics
- Tournament participation rates
- Revenue analytics
- Popular games and tournaments

### 7. System Settings
- App configuration
- Email templates
- Payment gateway settings
- Cloudinary configuration

---

## Dashboard Technology Stack

### Frontend
- **Framework**: React.js or Next.js
- **UI Library**: Material-UI or Ant Design
- **State Management**: Redux or Context API
- **Charts**: Chart.js or Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + Firebase Admin SDK

### Key Features
- Real-time updates using WebSocket
- Responsive design for mobile/tablet
- Dark/Light theme support
- Export data to CSV/PDF
- Bulk operations for users/tournaments

---

## Environment Variables for Dashboard

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://basha:king@freefire.lrfkfsu.mongodb.net/Flutter-winzone

# Firebase Admin
FIREBASE_PROJECT_ID=winzone-arena-1
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=drfy6umhn
CLOUDINARY_API_KEY=596969782927433
CLOUDINARY_API_SECRET=vNww_xC7wuPrrNnawtNEuJSog3E

# Razorpay
RAZORPAY_KEY_ID=rzp_live_GcrlJ48mEqrbHu
RAZORPAY_KEY_SECRET=yosO5yOJhCnYSyn7oQUniaZz

# SMTP
SMTP_EMAIL=kingkite789@gmail.com
SMTP_PASS=dykm hdhj zlqw kijq
```

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "timestamp": "2024-08-16T18:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-08-16T18:30:00.000Z"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Testing the APIs

### 1. Test Authentication
```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test Protected Endpoints
```bash
# Use the token from login response
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Test File Upload
```bash
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@test.jpg"
```

---

## Next Steps

1. **Set up the backend server** with all API endpoints
2. **Create the admin dashboard** using React/Next.js
3. **Test all API endpoints** using the curl commands above
4. **Implement real-time features** using WebSocket
5. **Add monitoring and logging** for production
6. **Set up automated testing** for API endpoints
7. **Deploy to production** with proper security measures
