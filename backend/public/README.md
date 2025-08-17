# WinZone Arena Admin Dashboard

## 🚀 Quick Start

### 1. Create Admin User
First, you need to create an admin user in your database:

```bash
cd backend
node create-admin.js
```

This will create an admin user with:
- **Email:** admin@winzone.com
- **Password:** admin123
- **Role:** admin

### 2. Access Admin Dashboard
Navigate to: `http://localhost:5000/admin-login.html`

### 3. Login
Use the credentials created in step 1 to log in.

### 4. Dashboard Access
After successful login, you'll be redirected to: `http://localhost:5000/admin-dashboard.html`

## 🔐 Authentication

The admin dashboard uses JWT tokens stored in localStorage. The token is automatically included in all API requests.

## 📱 Features

### Complete CRUD Operations for:
- **Users** - Create, read, update, delete users
- **Games** - Manage game catalog
- **Tournaments** - Create and manage tournaments
- **Registrations** - Handle tournament registrations
- **Transactions** - View financial transactions
- **Withdrawals** - Process withdrawal requests

### Advanced Features:
- Real-time search and filtering
- Status management
- Bulk operations
- Responsive design
- Professional UI/UX

## 🛠️ Technical Details

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express, MongoDB
- **Authentication:** JWT tokens
- **Styling:** Custom CSS with gradients and animations
- **Icons:** Font Awesome 6.0

## 🔧 Troubleshooting

### "Access token required" error:
1. Make sure you're logged in at `/admin-login.html`
2. Check if the admin user exists in your database
3. Verify the backend is running and accessible

### "Admin privileges required" error:
1. Ensure the user has `role: 'admin'` in the database
2. Check if the user is marked as `isActive: true`

## 📁 File Structure

```
backend/public/
├── admin-login.html      # Admin login page
├── admin-dashboard.html  # Main admin dashboard
├── admin-dashboard.js    # Dashboard functionality
├── test-admin.html       # Test page
└── README.md            # This file
```

## 🚨 Security Notes

- Change the default admin password after first login
- Use HTTPS in production
- Implement rate limiting for login attempts
- Consider adding 2FA for additional security

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify MongoDB connection
3. Ensure all backend routes are properly configured
4. Check if the admin user exists and has correct permissions
