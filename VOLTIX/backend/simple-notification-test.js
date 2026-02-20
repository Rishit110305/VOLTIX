import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

console.log('🔔 Sending simple test notifications...');

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Send a simple notification every 2 seconds
  let count = 1;
  
  const sendNotification = () => {
    const notification = {
      id: `test_${Date.now()}`,
      type: count % 2 === 0 ? 'SUCCESS' : 'INFO',
      title: `Test Notification #${count}`,
      message: `This is test notification number ${count}. You should see this as a toast!`,
      timestamp: new Date().toISOString(),
      priority: 'medium'
    };
    
    console.log(`📤 Sending notification #${count}`);
    socket.emit('notification', notification);
    
    count++;
    
    if (count <= 5) {
      setTimeout(sendNotification, 2000);
    } else {
      console.log('✅ All test notifications sent!');
      console.log('👀 Check your browser - you should see toast notifications!');
      setTimeout(() => {
        socket.disconnect();
        process.exit(0);
      }, 1000);
    }
  };
  
  // Start sending notifications after 1 second
  setTimeout(sendNotification, 1000);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected');
});