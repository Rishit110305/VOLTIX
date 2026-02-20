import axios from 'axios';
import { io } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

const baseUrl = 'http://localhost:5000';
const testUserId = 'USR_000004';

// Create socket connection for real-time notifications
const socket = io(baseUrl, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

async function sendTestNotifications() {
  console.log('🧪 SENDING TEST NOTIFICATIONS TO FRONTEND...\n');

  try {
    // Wait for socket connection
    await new Promise((resolve) => {
      socket.on('connect', () => {
        console.log('✅ Socket connected for testing');
        resolve();
      });
    });

    console.log('📡 Sending various notification types...\n');

    // 1. Agent Decision Notifications
    console.log('🤖 Sending Agent Decision Notifications...');
    
    const agentDecisions = [
      {
        agent: 'MechanicAgent',
        agentType: 'mechanic',
        action: 'FAILURE_DETECTED',
        stationId: 'ST001',
        explanation: 'Critical hardware failure detected in charging port 2. Immediate maintenance required.',
        confidence: 0.95,
        reasoning: 'Voltage irregularities and temperature spikes detected',
        timestamp: new Date().toISOString(),
        priority: 'urgent'
      },
      {
        agent: 'TrafficAgent',
        agentType: 'traffic',
        action: 'INCENTIVE_OFFERED',
        stationId: 'ST002',
        explanation: 'High congestion detected. Offering incentive to redirect users to nearby stations.',
        confidence: 0.87,
        reasoning: 'Queue length exceeds optimal threshold',
        timestamp: new Date().toISOString(),
        priority: 'high'
      },
      {
        agent: 'LogisticsAgent',
        agentType: 'logistics',
        action: 'DISPATCH_INITIATED',
        stationId: 'ST003',
        explanation: 'Low inventory detected. Dispatching refill truck to maintain service levels.',
        confidence: 0.92,
        reasoning: 'Inventory below 20% threshold',
        timestamp: new Date().toISOString(),
        priority: 'medium'
      }
    ];

    for (const decision of agentDecisions) {
      socket.emit('agent_decision', decision);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }

    // 2. System Alerts
    console.log('⚠️ Sending System Alerts...');
    
    const systemAlerts = [
      {
        id: `alert_${Date.now()}_1`,
        severity: 'error',
        title: 'Grid Connection Lost',
        message: 'Station ST004 has lost connection to the power grid. Running on backup power.',
        timestamp: new Date().toISOString(),
        priority: 'urgent',
        meta: {
          stationId: 'ST004',
          backupPowerRemaining: '2 hours',
          affectedChargers: 8
        }
      },
      {
        id: `alert_${Date.now()}_2`,
        severity: 'warning',
        title: 'High Temperature Alert',
        message: 'Ambient temperature at Station ST005 exceeds safe operating limits.',
        timestamp: new Date().toISOString(),
        priority: 'high',
        meta: {
          stationId: 'ST005',
          temperature: '45°C',
          threshold: '40°C'
        }
      }
    ];

    for (const alert of systemAlerts) {
      socket.emit('system_alert', alert);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Station Updates
    console.log('🔌 Sending Station Updates...');
    
    const stationUpdates = [
      {
        id: `station_${Date.now()}_1`,
        stationId: 'ST001',
        status: 'maintenance',
        message: 'Station ST001 is now under maintenance. Expected completion: 2 hours.',
        timestamp: new Date().toISOString(),
        location: 'Downtown Hub',
        meta: {
          maintenanceType: 'Hardware Repair',
          estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          affectedPorts: [2, 3]
        }
      },
      {
        id: `station_${Date.now()}_2`,
        stationId: 'ST006',
        status: 'operational',
        message: 'Station ST006 is back online with all charging ports operational.',
        timestamp: new Date().toISOString(),
        location: 'Mall Complex',
        meta: {
          totalPorts: 12,
          availablePorts: 12,
          utilizationRate: '15%'
        }
      }
    ];

    for (const update of stationUpdates) {
      socket.emit('station_update', update);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. Incentive Offers
    console.log('💰 Sending Incentive Offers...');
    
    const incentiveOffers = [
      {
        id: `incentive_${Date.now()}_1`,
        stationId: 'ST007',
        amount: 50,
        type: 'discount_amount',
        validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        message: 'Save ₹50 by switching to Station ST007. Less crowded and faster charging!',
        timestamp: new Date().toISOString(),
        meta: {
          originalStation: 'ST002',
          alternativeStation: 'ST007',
          estimatedSavings: 50,
          walkingDistance: '200m',
          waitTime: '5 minutes'
        }
      },
      {
        id: `incentive_${Date.now()}_2`,
        stationId: 'ST008',
        amount: 25,
        type: 'discount_percentage',
        validUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        message: 'Get 25% off your charging session at Station ST008. Limited time offer!',
        timestamp: new Date().toISOString(),
        meta: {
          discountPercentage: 25,
          maxDiscount: 100,
          conditions: 'Valid for next 10 minutes only'
        }
      }
    ];

    for (const incentive of incentiveOffers) {
      socket.emit('incentive_offer', incentive);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 5. Generic Notifications
    console.log('📢 Sending Generic Notifications...');
    
    const genericNotifications = [
      {
        id: `notif_${Date.now()}_1`,
        type: 'SUCCESS',
        title: 'Charging Session Complete',
        message: 'Your vehicle has been fully charged. Total cost: ₹245. Thank you for using our service!',
        timestamp: new Date().toISOString(),
        priority: 'low',
        category: 'charging_session',
        meta: {
          sessionId: 'CHG_789123',
          energyDelivered: '45 kWh',
          duration: '2h 15m',
          cost: 245
        }
      },
      {
        id: `notif_${Date.now()}_2`,
        type: 'INFO',
        title: 'New Feature Available',
        message: 'Smart scheduling is now available! Pre-book your charging slots to avoid waiting.',
        timestamp: new Date().toISOString(),
        priority: 'medium',
        category: 'feature_announcement',
        meta: {
          featureName: 'Smart Scheduling',
          availableFrom: new Date().toISOString()
        }
      },
      {
        id: `notif_${Date.now()}_3`,
        type: 'WARNING',
        title: 'Payment Method Expiring',
        message: 'Your registered credit card ending in 1234 will expire next month. Please update your payment method.',
        timestamp: new Date().toISOString(),
        priority: 'medium',
        category: 'payment_reminder',
        meta: {
          cardLast4: '1234',
          expiryDate: '02/2025'
        }
      }
    ];

    for (const notification of genericNotifications) {
      socket.emit('notification', notification);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 6. Create some database notifications via API
    console.log('💾 Creating Database Notifications via API...');
    
    const apiNotifications = [
      {
        userId: testUserId,
        type: 'system',
        title: 'Scheduled Maintenance',
        message: 'System maintenance scheduled for tonight 2:00 AM - 4:00 AM. Some features may be unavailable.',
        priority: 'high',
        channels: { socket: true, push: true },
        metadata: {
          eventType: 'MAINTENANCE_SCHEDULED',
          source: 'system',
          category: 'maintenance'
        }
      },
      {
        userId: testUserId,
        type: 'agent_action',
        agentType: 'energy',
        title: 'Energy Trading Opportunity',
        message: 'Selling 150kWh back to grid for ₹1,200 revenue. Grid prices are favorable.',
        priority: 'medium',
        channels: { socket: true, push: false },
        metadata: {
          eventType: 'TRADING_OPPORTUNITY',
          source: 'energy_agent',
          category: 'energy_trading',
          revenue: 1200,
          energyAmount: 150
        }
      }
    ];

    for (const notification of apiNotifications) {
      try {
        const response = await axios.post(`${baseUrl}/api/notifications`, notification);
        console.log(`✅ API notification created: ${response.data.data.notificationId}`);
      } catch (error) {
        console.error(`❌ Failed to create API notification:`, error.response?.data || error.message);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎉 ALL TEST NOTIFICATIONS SENT!');
    console.log('\n📱 Check your frontend for:');
    console.log('   ✨ Toast notifications (should appear in real-time)');
    console.log('   🔔 Notification bell with unread count');
    console.log('   📋 Full notifications page at /dashboard/notifications');
    console.log('   🎯 Different notification types and priorities');
    console.log('   💰 Incentive offers with action buttons');
    console.log('   🤖 Agent decisions with detailed metadata');

    // Keep socket open for a bit to ensure all messages are sent
    setTimeout(() => {
      socket.disconnect();
      console.log('\n🔌 Socket disconnected. Test complete!');
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('❌ Test failed:', error);
    socket.disconnect();
    process.exit(1);
  }
}

// Handle socket events
socket.on('connect', () => {
  console.log('🔗 Connected to notification system');
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from notification system');
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Start the test
sendTestNotifications();