const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://basha:king@freefire.lrfkfsu.mongodb.net/Flutter-winzone?retryWrites=true&w=majority&appName=FreeFire';

async function deleteAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    // Delete admin user
    const result = await User.deleteOne({ role: 'admin' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Admin user deleted successfully');
    } else {
      console.log('⚠️  No admin user found to delete');
    }

  } catch (error) {
    console.error('❌ Error deleting admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

deleteAdminUser();
