// Service Worker for Push Notifications
const CACHE_NAME = 'voltix-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);

  let data = {};
  
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('❌ Failed to parse push data:', error);
    data = {
      title: 'Voltix Notification',
      message: 'You have a new notification',
      icon: '/favicon.ico'
    };
  }

  const options = {
    body: data.message || data.body || 'You have a new notification',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: data.meta || data.data || {},
    tag: data.tag || 'voltix-notification',
    requireInteraction: data.priority === 'critical' || data.priority === 'high',
    silent: data.priority === 'low',
    actions: data.actions || [],
    timestamp: Date.now(),
    vibrate: data.priority === 'critical' ? [200, 100, 200] : [100]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Voltix Notification',
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  // Handle different actions
  if (action === 'view') {
    // Open the app to view details
    event.waitUntil(
      clients.openWindow(data.url || '/dashboard')
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open new window
        if (clients.openWindow) {
          return clients.openWindow(data.url || '/dashboard');
        }
      })
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notification closed:', event);
  
  // Track notification dismissal if needed
  const data = event.notification.data || {};
  if (data.trackDismissal) {
    // Send analytics or tracking data
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'dismissed',
        notificationId: data.id,
        timestamp: Date.now()
      })
    }).catch(error => {
      console.error('Failed to track notification dismissal:', error);
    });
  }
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Sync notifications when back online
async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications/sync', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const notifications = await response.json();
      
      // Show any missed notifications
      for (const notification of notifications) {
        await self.registration.showNotification(
          notification.title,
          {
            body: notification.message,
            icon: notification.icon || '/favicon.ico',
            data: notification.data || {},
            tag: `sync-${notification.id}`
          }
        );
      }
    }
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('📨 Message received in SW:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});