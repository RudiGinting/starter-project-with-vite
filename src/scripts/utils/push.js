import { getVapidPublicKey, subscribePush, unsubscribePush } from '../data/api';

function decodeBase64Url(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value.replace(/-/g, '+').replace(/_/g, '/')}${padding}`;
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export async function getPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function enablePushNotifications() {
  if (!('Notification' in window) || !('PushManager' in window)) {
    throw new Error('Browser tidak mendukung push notification.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Izin notifikasi belum diberikan.');

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const keyResponse = await getVapidPublicKey();
    const publicKey = keyResponse.publicKey || keyResponse.vapidPublicKey;
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeBase64Url(publicKey),
    });
  }

  const payload = subscription.toJSON();
  const result = await subscribePush({
    endpoint: payload.endpoint,
    keys: payload.keys,
  });
  if (result.error) throw new Error(result.message || 'Gagal mengaktifkan notifikasi.');
  return subscription;
}

export async function disablePushNotifications() {
  const subscription = await getPushSubscription();
  if (!subscription) return;

  const result = await unsubscribePush(subscription.endpoint);
  if (result.error) throw new Error(result.message || 'Gagal menonaktifkan notifikasi.');
  await subscription.unsubscribe();
}