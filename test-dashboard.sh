#!/bin/bash

echo "🧪 Testing Admin Dashboard API..."
echo ""

# Step 1: Login
echo "1️⃣ Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shopx.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Login successful!"
echo ""

# Step 2: Get Dashboard Data
echo "2️⃣ Fetching dashboard data..."
DASHBOARD_RESPONSE=$(curl -s -X GET http://localhost:4000/api/admin/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

# Check if response contains error
if echo "$DASHBOARD_RESPONSE" | grep -q "error\|Error\|Unauthorized"; then
  echo "❌ Dashboard request failed!"
  echo "$DASHBOARD_RESPONSE"
  exit 1
fi

echo "✅ Dashboard data retrieved!"
echo ""

# Step 3: Check for payment fields
echo "3️⃣ Checking payment status fields..."
if echo "$DASHBOARD_RESPONSE" | grep -q "paidOrders"; then
  PAID_ORDERS=$(echo "$DASHBOARD_RESPONSE" | grep -o '"paidOrders":[0-9]*' | cut -d':' -f2)
  echo "✅ paidOrders field found: $PAID_ORDERS"
else
  echo "⚠️  paidOrders field missing!"
fi

if echo "$DASHBOARD_RESPONSE" | grep -q "unpaidOrders"; then
  UNPAID_ORDERS=$(echo "$DASHBOARD_RESPONSE" | grep -o '"unpaidOrders":[0-9]*' | cut -d':' -f2)
  echo "✅ unpaidOrders field found: $UNPAID_ORDERS"
else
  echo "⚠️  unpaidOrders field missing!"
fi

echo ""

# Step 4: Check recent activity
echo "4️⃣ Checking recent activity..."
if echo "$DASHBOARD_RESPONSE" | grep -q "recentActivity"; then
  echo "✅ recentActivity field found"
  
  # Count order activities
  ORDER_COUNT=$(echo "$DASHBOARD_RESPONSE" | grep -o '"type":"order"' | wc -l | tr -d ' ')
  echo "   Found $ORDER_COUNT order activities"
  
  # Check for payment status in activities
  PAYMENT_STATUS_COUNT=$(echo "$DASHBOARD_RESPONSE" | grep -o '"paymentStatus":"[^"]*' | wc -l | tr -d ' ')
  echo "   Found $PAYMENT_STATUS_COUNT payment status entries"
  
  if [ "$PAYMENT_STATUS_COUNT" -gt 0 ]; then
    echo "✅ Payment status information present in activities!"
  else
    echo "⚠️  No payment status found in activities"
  fi
else
  echo "⚠️  recentActivity field missing!"
fi

echo ""
echo "📊 Dashboard Summary:"
echo "$DASHBOARD_RESPONSE" | grep -o '"users":[0-9]*\|"products":[0-9]*\|"orders":[0-9]*\|"revenue":[0-9.]*\|"pendingOrders":[0-9]*\|"paidOrders":[0-9]*\|"unpaidOrders":[0-9]*' | sed 's/"/ /g' | sed 's/:/: /g'

echo ""
echo "✅ Test completed!"
echo ""
echo "💡 Frontend URL: http://localhost:5173/admin"
echo "   Login: admin@shopx.com / admin123"
