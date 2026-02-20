"use client";

import api from "../config/api";

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const subscribePush = async (): Promise<boolean> => {
  try {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return false;
    }

    // Check if push messaging is supported
    if (!('PushManager' in window)) {
      console.warn('Push messaging not supported');
      return false;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service worker registered');

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Get VAPID public key from environment
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('VAPID public key not found in environment variables');
      return false;
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('✅ Push subscription created');

    // Send subscription to backend
    await api.post('/api/push/subscribe', {
      subscription: subscription.toJSON()
    });

    console.log('✅ Push subscription sent to backend');
    return true;

  } catch (error) {
    console.error('❌ Push subscription failed:', error);
    return false;
  }
};

export const unsubscribePush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.warn('No service worker registration found');
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.warn('No push subscription found');
      return true; // Already unsubscribed
    }

    // Unsubscribe from push notifications
    await subscription.unsubscribe();
    console.log('✅ Push subscription cancelled');

    // Notify backend
    await api.post('/api/push/unsubscribe', {
      subscription: subscription.toJSON()
    });

    console.log('✅ Backend notified of unsubscription');
    return true;

  } catch (error) {
    console.error('❌ Push unsubscription failed:', error);
    return false;
  }
};

export const checkPushSubscription = async (): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;

  } catch (error) {
    console.error('❌ Failed to check push subscription:', error);
    return false;
  }
};

export const testPushNotification = async (): Promise<boolean> => {
  try {
    await api.post('/api/push/test');
    console.log('✅ Test push notification sent');
    return true;
  } catch (error) {
    console.error('❌ Test push notification failed:', error);
    return false;
  }
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default {
  subscribePush,
  unsubscribePush,
  checkPushSubscription,
  testPushNotification
};