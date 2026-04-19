const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/ms_garments');

const db = mongoose.connection;

db.on('connected', async () => {
  try {
    // Define schemas
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema, 'users');
    
    const productSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model('Product', productSchema, 'products');

    console.log('\n🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});

    console.log('\n👥 Creating test users...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        name: 'Admin User',
        email: 'admin@msgarments.com',
        password: hashedPassword,
        role: 'admin'
      },
      {
        name: 'Employee 1',
        email: 'employee1@msgarments.com',
        password: hashedPassword,
        role: 'employee'
      },
      {
        name: 'Employee 2',
        email: 'employee2@msgarments.com',
        password: hashedPassword,
        role: 'employee'
      },
      {
        name: 'Buyer Jack',
        email: 'jack@gmail.com',
        password: hashedPassword,
        role: 'buyer'
      },
      {
        name: 'Buyer Sarah',
        email: 'sarah@gmail.com',
        password: hashedPassword,
        role: 'buyer'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    createdUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));

    console.log('\n📦 Creating test products...');
    const products = [
      {
        productId: 'PRD-001',
        name: 'COTTON LEGGINGS',
        description: 'Comfortable cotton leggings',
        category: 'Garments',
        price: 599,
        stock: 1000,
        supplier: 'Local Supplier'
      },
      {
        productId: 'PRD-002',
        name: 'SILK SAREE',
        description: 'Traditional silk saree',
        category: 'Garments',
        price: 2999,
        stock: 300,
        supplier: 'Regional Supplier'
      },
      {
        productId: 'PRD-003',
        name: 'COTTON T-SHIRT',
        description: 'Plain cotton t-shirt',
        category: 'Garments',
        price: 299,
        stock: 2000,
        supplier: 'Local Supplier'
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);
    createdProducts.forEach(p => console.log(`  - ${p.name} (${p.stock} units)`));

    console.log('\n✅ Test data setup complete!');
    console.log('\n📝 Login credentials:');
    console.log('  Admin: admin@msgarments.com / password123');
    console.log('  Employee: employee1@msgarments.com / password123');
    console.log('  Buyer: jack@gmail.com / password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
});
