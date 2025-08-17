# 🎮 Winzone Arena - Gaming Tournament & Community App

A comprehensive Flutter application for competitive gaming tournaments, community engagement, and player management.

## ✨ Features

### 🏆 Tournaments
- **Paid Tournaments**: Entry fee-based competitions with prize pools
- **Free Matches**: Skill-building practice matches
- **Game Selection**: Support for popular games (Free Fire, PUBG, Chess, etc.)
- **Tournament Management**: Registration, slots, and status tracking

### 🌐 Community Feed
- **Public Posts**: Instagram-like feed for gaming content
- **Content Types**: Text, images, memes, and gameplay highlights
- **Social Features**: Like, comment, and share functionality
- **Content Moderation**: Community guidelines and post validation

### 💰 Wallet & Transactions
- **Balance Management**: Track deposits, winnings, and expenses
- **Payment Integration**: Razorpay for deposits
- **Withdrawal System**: Manual approval process
- **Transaction History**: Complete financial tracking

### 👤 User Management
- **Authentication**: Email, phone, and Google Sign-In
- **Profile Management**: Customizable gaming profiles
- **Game IDs**: Store multiple game identifiers
- **Performance Tracking**: Stats, rankings, and achievements

### 🎯 Ranking System
- **Skill Algorithm**: Based on wins, kills, and matches played
- **Leaderboards**: Competitive rankings across games
- **Progress Tracking**: Visual representation of improvement

## 🚀 Getting Started

### Prerequisites
- Flutter SDK (latest stable version)
- Dart SDK
- Android Studio / VS Code
- Firebase project setup
- Razorpay account
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/winzone_arena.git
   cd winzone_arena
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Configure Firebase**
   - Create a new Firebase project
   - Enable Authentication, Firestore, and Storage
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the respective platform folders

4. **Configure Razorpay**
   - Update `YOUR_RAZORPAY_KEY` in `lib/services/payment_service.dart`
   - Configure webhook endpoints

5. **Configure Cloudinary**
   - Update `YOUR_CLOUD_NAME` and `YOUR_UPLOAD_PRESET` in `lib/services/image_service.dart`

6. **Run the app**
   ```bash
   flutter run
   ```

## 🏗️ Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   ├── user_model.dart      # User data structure
│   ├── tournament_model.dart # Tournament data
│   ├── post_model.dart      # Community posts
│   └── transaction_model.dart # Financial transactions
├── screens/                  # UI screens
│   ├── auth/                # Authentication screens
│   ├── tournaments/         # Tournament management
│   ├── community/           # Community features
│   ├── wallet/              # Financial management
│   └── profile/             # User profile
├── services/                 # Business logic
│   ├── auth_service.dart    # Authentication
│   ├── database_service.dart # Firestore operations
│   ├── payment_service.dart # Razorpay integration
│   └── image_service.dart   # Cloudinary integration
├── widgets/                  # Reusable components
│   ├── tournament_card.dart # Tournament display
│   └── post_card.dart       # Post display
└── utils/                    # Utilities
    └── theme.dart           # App theming
```

## 🔧 Configuration

### Firebase Setup
1. Enable Authentication methods (Email/Password, Google, Phone)
2. Set up Firestore database with appropriate security rules
3. Configure Storage for profile pictures and post images

### Razorpay Integration
1. Create a Razorpay account
2. Generate API keys
3. Configure webhook endpoints for payment status updates

### Cloudinary Setup
1. Create a Cloudinary account
2. Set up upload presets
3. Configure folder structure for organized image storage

## 📱 Platform Support

- ✅ Android
- ✅ iOS  
- ✅ Web (Responsive)

## 🎨 UI/UX Features

- **Dark Theme**: Gaming-inspired dark mode with neon accents
- **Responsive Design**: Works on all screen sizes
- **Custom Navigation**: Large center button for community feed
- **Modern Cards**: Material Design 3 with gaming aesthetics
- **Smooth Animations**: Engaging user interactions

## 🔐 Security Features

- **Firebase Security Rules**: Database access control
- **Input Validation**: Form validation and sanitization
- **Image Validation**: File type and size restrictions
- **Authentication**: Secure user login and session management

## 📊 Database Schema

### Collections
- **users**: User profiles and gaming stats
- **tournaments**: Tournament information and registrations
- **posts**: Community feed content
- **transactions**: Financial transaction records

### Key Fields
- User ranking scores
- Tournament status tracking
- Post engagement metrics
- Transaction audit trails

## 🚀 Deployment

### Android
```bash
flutter build apk --release
```

### iOS
```bash
flutter build ios --release
```

### Web
```bash
flutter build web --release
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- **Real-time Chat**: In-app messaging system
- **Tournament Brackets**: Advanced tournament management
- **Live Streaming**: Integration with streaming platforms
- **Mobile Notifications**: Push notifications for updates
- **Analytics Dashboard**: Advanced user and tournament analytics
- **Multi-language Support**: Internationalization
- **Offline Mode**: Basic functionality without internet

## 📈 Performance

- **Optimized Images**: Efficient image loading and caching
- **Lazy Loading**: Progressive content loading
- **State Management**: Efficient data flow with Provider
- **Memory Management**: Proper resource cleanup

## 🧪 Testing

```bash
# Run unit tests
flutter test

# Run integration tests
flutter test integration_test/

# Generate coverage report
flutter test --coverage
```

## 📱 Screenshots

*Add screenshots of key app screens here*

---

**Built with ❤️ using Flutter**

*Winzone Arena - Where Gamers Compete and Connect*
# Winzone_community
