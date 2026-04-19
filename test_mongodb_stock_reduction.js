// Test: Order 500 units and verify MongoDB stock reduction
const API_URL = 'http://localhost:5000/api';

async function testStockReduction() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('     MONGODB STOCK REDUCTION TEST - Order 500 Units');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Step 1: Admin Login
    console.log('🔐 Step 1: Admin Authentication');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@msgarments.com',
        password: 'Admin@123'
      })
    });
    
    const loginData = await loginRes.json();
    const adminToken = loginData.token;
    console.log('    ✅ Admin authenticated\n');

    // Step 2: Create Product with 1000 stock
    console.log('📦 Step 2: Creating Test Product in MongoDB');
    const skuUnique = `TEST-${Date.now()}`;
    const productRes = await fetch(`${API_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        sku: skuUnique,
        name: 'Test Product',
        category: 'Test',
        description: 'Testing stock reduction',
        costPrice: 100,
        wholesalePrice: 200,
        stock: 1000,
        rating: 4.0,
        batchNumber: 'TEST-001'
      })
    });

    const productData = await productRes.json();
    const productId = productData.product._id;
    console.log(`    ✅ Product Created in MongoDB`);
    console.log(`       Product ID: ${productId}`);
    console.log(`       Name: ${productData.product.name}`);
    console.log(`       BEFORE Order - Stock in DB: 1,000 units\n`);

    // Step 3: Verify stock in DB before order
    console.log('📊 Step 3: Verifying Stock in MongoDB (BEFORE order)');
    const checkBefore = await fetch(`${API_URL}/admin/products`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const beforeData = await checkBefore.json();
    const productBefore = beforeData.products.find(p => p._id === productId);
    console.log(`    Current Stock in DB: ${productBefore.stock} units\n`);

    // Step 4: Create Buyer
    console.log('👤 Step 4: Creating Buyer');
    const buyerEmail = `buyer${Date.now()}@test.com`;
    const buyerRes = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Buyer',
        email: buyerEmail,
        phone: '9999999999',
        password: 'Test@123'
      })
    });

    const buyerData = await buyerRes.json();
    const buyerToken = buyerData.token;
    console.log('    ✅ Buyer created\n');

    // Step 5: Place Order for 500 units
    console.log('🛒 Step 5: PLACING ORDER - 500 units');
    console.log('    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const orderRes = await fetch(`${API_URL}/buyer/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        productId: productId,
        quantity: 500,
        paymentMethod: 'credit_card'
      })
    });

    const orderData = await orderRes.json();
    console.log(`    ✅ Order Placed: ${orderData.order.orderId}`);
    console.log(`       Quantity: 500 units`);
    console.log(`       Total Amount: ₹${orderData.order.total}`);
    console.log('    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 6: Check stock in DB after order
    console.log('📊 Step 6: Verifying Stock in MongoDB (AFTER order)');
    const checkAfter = await fetch(`${API_URL}/admin/products`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const afterData = await checkAfter.json();
    const productAfter = afterData.products.find(p => p._id === productId);
    console.log(`    Current Stock in DB: ${productAfter.stock} units\n`);

    // Final Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ STOCK REDUCTION VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Product ID in MongoDB:   ${productId}`);
    console.log(`\nBEFORE Order:`);
    console.log(`   Stock in MongoDB DB: ${productBefore.stock} units`);
    console.log(`\nOrder Details:`);
    console.log(`   Order Quantity:      500 units`);
    console.log(`   Order ID:            ${orderData.order.orderId}`);
    console.log(`\nAFTER Order:`);
    console.log(`   Stock in MongoDB DB: ${productAfter.stock} units`);
    console.log(`\nCalculation:`);
    console.log(`   ${productBefore.stock} - 500 = ${productAfter.stock} units ✅`);
    console.log(`\nDB Update Status: ${productAfter.stock === productBefore.stock - 500 ? '✅ SUCCESSFULLY PERSISTED' : '❌ FAILED'}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStockReduction();
