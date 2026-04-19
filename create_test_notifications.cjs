const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ms_garments');

const db = mongoose.connection;

db.on('connected', async () => {
  try {
    // Get schemas
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema, 'users');
    
    const notificationSchema = new mongoose.Schema({}, { strict: false });
    const Notification = mongoose.model('Notification', notificationSchema, 'notifications');

    // Get admin user
    const admin = await User.findOne({ email: 'admin@msgarments.com' });
    console.log('📋 Admin user:', admin?.email, 'ID:', admin?._id);

    if (!admin) {
      console.error('❌ Admin user not found!');
      mongoose.connection.close();
      return;
    }

    // Create test notifications for admin
    console.log('\n📝 Creating test notifications...');
    const testNotifications = [
      {
        userId: admin._id,
        userEmail: admin.email,
        type: 'new_order',
        title: 'New Order Received',
        message: 'Jack has placed an order for 100 units of COTTON LEGGINGS',
        orderId: new mongoose.Types.ObjectId(),
        orderNumber: 'ORD-20260317-001',
        productId: 'PRD-001',
        productName: 'COTTON LEGGINGS',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: admin._id,
        userEmail: admin.email,
        type: 'low_stock_alert',
        title: 'Low Stock Alert',
        message: 'COTTON LEGGINGS stock has fallen below 500 units',
        productId: 'PRD-001',
        productName: 'COTTON LEGGINGS',
        currentStock: 350,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: admin._id,
        userEmail: admin.email,
        type: 'order_confirmed',
        title: 'Order Confirmed',
        message: 'Order ORD-20260317-001 has been confirmed',
        orderId: new mongoose.Types.ObjectId(),
        orderNumber: 'ORD-20260317-001',
        read: false,
        createdAt: new Date(Date.now() - 60000),
        updatedAt: new Date(Date.now() - 60000)
      }
    ];

    const created = await Notification.insertMany(testNotifications);
    console.log(`✅ Created ${created.length} test notifications`);

    // Also create notifications for buyer jack
    const buyer = await User.findOne({ email: 'jack@gmail.com' });
    if (buyer) {
      const buyerNotifications = [
        {
          userId: buyer._id,
          userEmail: buyer.email,
          type: 'new_order',
          title: 'Order Placed Successfully',
          message: 'Your order ORD-20260317-001 has been placed for ₹59,900.00',
          orderId: testNotifications[0].orderId,
          orderNumber: 'ORD-20260317-001',
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      const buyerCreated = await Notification.insertMany(buyerNotifications);
      console.log(`✅ Created ${buyerCreated.length} buyer notifications`);
    }

    console.log('\n✅ Test notifications created successfully!');
    console.log('🔄 Refresh the browser to see notifications appear');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
});
