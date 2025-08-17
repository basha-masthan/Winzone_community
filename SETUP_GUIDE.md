# Winzone Arena Setup Guide

## Project Configuration

### 1. Firebase Setup (Authentication Only)
- Project ID: `winzone-arena-1`
- Go to Firebase Console and enable Authentication
- Enable Email/Password and Google Sign-In
- Copy your web app config to `firebase_options.dart`

### 2. MongoDB Connection
- Database: `Flutter-winzone`
- Connection string already configured
- Collections will be created automatically

### 3. Cloudinary Setup
- Cloud Name: `drfy6umhn`
- API Key: `596969782927433`
- Create upload preset named `ml_default`

### 4. Razorpay Setup
- Key ID: `rzp_live_GcrlJ48mEqrbHu`
- Already configured in payment service

### 5. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your values
npm run dev
```

## Features Implemented

✅ Bottom navigation bar
✅ Game selection before tournaments
✅ Tournament registration with entry fee
✅ Free tournament registration
✅ Profile with My Matches tab
✅ Payment integration with Razorpay
✅ MongoDB backend service
✅ Cloudinary image upload
✅ Firebase authentication

## Next Steps

1. Set up Firebase authentication
2. Run the backend server
3. Test tournament registration
4. Test payment flow
5. Deploy to production
