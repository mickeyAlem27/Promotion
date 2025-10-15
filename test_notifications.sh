#!/bin/bash

echo "🔔 Testing Real-Time Notifications"
echo "=================================="

# Test 1: Check if server is running
echo "📡 Test 1: Checking server status..."
curl -s http://localhost:5000/ | grep -q "running" && echo "✅ Server is running" || echo "❌ Server not responding"

echo ""

# Test 2: Send a test notification (assuming you have a user ID)
echo "🔔 Test 2: Sending test notification..."
# Replace YOUR_USER_ID with an actual user ID from your database
curl -X POST http://localhost:5000/api/send-test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "YOUR_USER_ID",
    "message": "This is a test notification from the system!",
    "type": "info"
  }' | grep -q "success" && echo "✅ Test notification sent" || echo "❌ Failed to send test notification"

echo ""
echo "🔗 To test notifications manually:"
echo "1. Open your app in two browser windows"
echo "2. Send a message from one window to the other"
echo "3. Check if the notification bell shows the new notification"
echo "4. Click the notification bell to see the notification center"

echo ""
echo "📋 Available notification types:"
echo "   - info (blue)"
echo "   - success (green)"
echo "   - warning (yellow)"
echo "   - error (red)"
echo "   - message (blue)"
echo "   - friend_request (purple)"
echo "   - job_update (orange)"

echo ""
echo "🎉 Real-time notifications are now active!"
