const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ms_garments', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Connection error:', err));

const db = mongoose.connection;

db.on('connected', async () => {
  try {
    // Get the Notification schema
    const notificationSchema = new mongoose.Schema({}, { strict: false });
    const Notification = mongoose.model('Notification', notificationSchema, 'notifications');
    
    // Get the User schema  
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema, 'users');

    // Get admin user
    console.log('\n📋 ADMIN USERS:');
    const adminUsers = await User.find({ role: 'admin' });
    adminUsers.forEach(user => {
      console.log(`  ID: ${user._id}, Email: ${user.email}, Name: ${user.name}`);
    });

    // Get all unique userIds in notifications
    console.log('\n📋 NOTIFICATIONS:');
    const notifications = await Notification.find().lean();
    const uniqueUserIds = new Set(notifications.map(n => n.userId?.toString()));
    console.log(`Total notifications: ${notifications.length}`);
    console.log(`Unique userIds: ${uniqueUserIds.size}`);
    
    // Show each unique userId and count
    const userCounts = {};
    notifications.forEach(n => {
      const uid = n.userId?.toString() || 'unknown';
      userCounts[uid] = (userCounts[uid] || 0) + 1;
    });
    
    console.log('\n📬 Notifications by userId:');
    for (const [uid, count] of Object.entries(userCounts)) {
      const user = await User.findById(uid);
      console.log(`  ${uid} (${user?.email || 'UNKNOWN'}): ${count} notifications`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
});
