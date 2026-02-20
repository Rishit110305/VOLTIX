import express from 'express';

const router = express.Router();

// Test endpoint to trigger notifications
router.post('/notification', (req, res) => {
  const io = req.app.get('io');
  
  if (!io) {
    return res.status(500).json({ error: 'Socket.IO not initialized' });
  }

  const { type = 'notification', data } = req.body;

  // Default test notification
  const testNotification = {
    id: `test_${Date.now()}`,
    type: 'INFO',
    title: 'Test Notification',
    message: 'This is a test notification from the backend',
    timestamp: new Date().toISOString(),
    priority: 'medium',
    ...data
  };

  console.log(`📤 Emitting ${type} event:`, testNotification);
  
  // Emit the notification
  io.emit(type, testNotification);

  res.json({
    success: true,
    message: `${type} notification sent`,
    data: testNotification
  });
});

// Test different notification types
router.post('/agent-decision', (req, res) => {
  const io = req.app.get('io');
  
  const agentDecision = {
    agent: 'MechanicAgent',
    agentType: 'mechanic',
    action: 'FAILURE_DETECTED',
    stationId: 'ST001',
    explanation: 'Critical hardware failure detected in charging port 2',
    confidence: 0.95,
    reasoning: 'Voltage irregularities detected',
    timestamp: new Date().toISOString(),
    priority: 'urgent'
  };

  console.log('📤 Emitting agent_decision:', agentDecision);
  io.emit('agent_decision', agentDecision);

  res.json({
    success: true,
    message: 'Agent decision notification sent',
    data: agentDecision
  });
});

router.post('/system-alert', (req, res) => {
  const io = req.app.get('io');
  
  const systemAlert = {
    id: `alert_${Date.now()}`,
    severity: 'error',
    title: 'Grid Connection Lost',
    message: 'Station ST004 has lost connection to the power grid',
    timestamp: new Date().toISOString(),
    priority: 'urgent',
    meta: {
      stationId: 'ST004',
      backupPowerRemaining: '2 hours'
    }
  };

  console.log('📤 Emitting system_alert:', systemAlert);
  io.emit('system_alert', systemAlert);

  res.json({
    success: true,
    message: 'System alert sent',
    data: systemAlert
  });
});

router.post('/incentive-offer', (req, res) => {
  const io = req.app.get('io');
  
  const incentiveOffer = {
    id: `incentive_${Date.now()}`,
    stationId: 'ST007',
    amount: 50,
    type: 'discount_amount',
    validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    message: 'Save ₹50 by switching to Station ST007',
    timestamp: new Date().toISOString(),
    meta: {
      originalStation: 'ST002',
      alternativeStation: 'ST007'
    }
  };

  console.log('📤 Emitting incentive_offer:', incentiveOffer);
  io.emit('incentive_offer', incentiveOffer);

  res.json({
    success: true,
    message: 'Incentive offer sent',
    data: incentiveOffer
  });
});

export default router;