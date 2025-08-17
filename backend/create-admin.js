const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = 'mongodb+srv://basha:king@freefire.lrfkfsu.mongodb.net/Flutter-winzone?retryWrites=true&w=majority&appName=FreeFire';

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists:', existingAdmin.email);
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@winzone.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            balance: 0,
            uid: 'admin_' + Date.now()
        });

        await adminUser.save();
        console.log('Admin user created successfully!');
        console.log('Email: admin@winzone.com');
        console.log('Password: admin123');
        console.log('Role: admin');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the function
createAdminUser();
