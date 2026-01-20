// Test script for Admin Dashboard API
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

async function testAdminDashboard() {
  console.log('🧪 Testing Admin Dashboard API...\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Testing Admin Login...');
    const loginResponse = await axios.post(`${API_URL}/admin/login`, {
      email: 'admin@shopx.com',
      password: 'admin123'
    });

    if (!loginResponse.data.token) {
      throw new Error('Login failed - no token received');
    }

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful!\n');

    // Step 2: Get Dashboard Stats
    console.log('2️⃣ Testing Dashboard Stats Endpoint...');
    const dashboardResponse = await axios.get(`${API_URL}/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const stats = dashboardResponse.data;
    console.log('✅ Dashboard data retrieved successfully!\n');

    // Step 3: Verify Dashboard Stats Structure
    console.log('3️⃣ Verifying Dashboard Stats Structure...');
    const requiredFields = ['users', 'products', 'orders', 'revenue', 'pendingOrders', 'recentActivity'];
    const missingFields = requiredFields.filter(field => !(field in stats));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    console.log('✅ All required fields present!\n');

    // Step 4: Check Payment Status Fields
    console.log('4️⃣ Checking Payment Status Fields...');
    if (!stats.paidOrders && stats.paidOrders !== 0) {
      console.log('⚠️  paidOrders field missing');
    } else {
      console.log(`✅ Paid Orders: ${stats.paidOrders}`);
    }

    if (!stats.unpaidOrders && stats.unpaidOrders !== 0) {
      console.log('⚠️  unpaidOrders field missing');
    } else {
      console.log(`✅ Unpaid Orders: ${stats.unpaidOrders}`);
    }
    console.log('');

    // Step 5: Verify Recent Activity Structure
    console.log('5️⃣ Verifying Recent Activity Structure...');
    if (!Array.isArray(stats.recentActivity)) {
      throw new Error('recentActivity is not an array');
    }

    console.log(`✅ Found ${stats.recentActivity.length} recent activities\n`);

    // Step 6: Check Activity Items for Payment Info
    console.log('6️⃣ Checking Activity Items for Payment Information...');
    const orderActivities = stats.recentActivity.filter(a => a.type === 'order');
    
    if (orderActivities.length > 0) {
      console.log(`✅ Found ${orderActivities.length} order activities`);
      orderActivities.forEach((activity, index) => {
        console.log(`\n   Order Activity ${index + 1}:`);
        console.log(`   - ID: ${activity.id}`);
        console.log(`   - Action: ${activity.action}`);
        console.log(`   - User: ${activity.userName || 'N/A'}`);
        console.log(`   - Amount: $${activity.amount || 'N/A'}`);
        console.log(`   - Items Count: ${activity.itemsCount || 'N/A'}`);
        console.log(`   - Order Status: ${activity.orderStatus || 'N/A'}`);
        console.log(`   - Payment Status: ${activity.paymentStatus || 'N/A'}`);
        console.log(`   - Time: ${activity.time || 'N/A'}`);
        
        // Verify payment status exists
        if (!activity.paymentStatus) {
          console.log('   ⚠️  WARNING: Payment status missing!');
        } else {
          console.log(`   ✅ Payment status: ${activity.paymentStatus}`);
        }
      });
    } else {
      console.log('ℹ️  No order activities found (this is okay if there are no recent orders)');
    }

    // Step 7: Summary
    console.log('\n📊 Dashboard Summary:');
    console.log(`   Total Users: ${stats.users}`);
    console.log(`   Total Products: ${stats.products}`);
    console.log(`   Total Orders: ${stats.orders}`);
    console.log(`   Total Revenue: $${stats.revenue || 0}`);
    console.log(`   Pending Orders: ${stats.pendingOrders}`);
    console.log(`   Paid Orders: ${stats.paidOrders || 'N/A'}`);
    console.log(`   Unpaid Orders: ${stats.unpaidOrders || 'N/A'}`);
    console.log(`   Recent Activities: ${stats.recentActivity.length}`);

    console.log('\n✅ All tests passed! Dashboard API is working correctly.\n');
    console.log('💡 You can now check the frontend at http://localhost:5173/admin');
    console.log('   Login with: admin@shopx.com / admin123\n');

  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.data}`);
    } else if (error.request) {
      console.error('   Error: No response from server. Is the backend running on port 4000?');
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

testAdminDashboard();
