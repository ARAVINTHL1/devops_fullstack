const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ms_garments', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('connected', async () => {
  try {
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema, 'users');
    
    const users = await User.find().lean();
    console.log('\n📋 ALL USERS IN DATABASE:');
    console.log('Total users:', users.length);
    
    users.forEach(u => {
      console.log(`  - Email: ${u.email}, Role: ${u.role}, ID: ${u._id}`);
    });

    // Also check notifications
    const notificationSchema = new mongoose.Schema({}, { strict: false });
    const Notification = mongoose.model('Notification', notificationSchema, 'notifications');
    const notifications = await Notification.find().lean();
    console.log('\n📬 NOTIFICATIONS:');
    console.log('Total notifications:', notifications.length);
    
  } catch(e) {
    console.error('❌ Error:', e.message);
  }
  mongoose.connection.close();
});
