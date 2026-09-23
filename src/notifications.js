import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const WATER_ID_START = 41000;
const WATER_ID_END = 41063;

function timeToMinutes(value) {
  const [h = '0', m = '0'] = String(value || '00:00').split(':');
  return (Number(h) * 60) + Number(m);
}

function buildReminderTimes(start, end, intervalMinutes) {
  const startMinutes = timeToMinutes(start);
  let endMinutes = timeToMinutes(end);
  const interval = Math.max(30, Number(intervalMinutes) || 60);

  if (endMinutes <= startMinutes) endMinutes += 24 * 60;

  const result = [];
  for (let current = startMinutes + interval; current <= endMinutes && result.length < 60; current += interval) {
    const normalized = current % (24 * 60);
    result.push({
      hour: Math.floor(normalized / 60),
      minute: normalized % 60,
    });
  }
  return result;
}

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function getReminderTimes(settings) {
  return buildReminderTimes(settings.startTime, settings.endTime, settings.intervalMinutes);
}

export async function cancelNativeWaterReminders() {
  if (!isNativeApp()) return;
  const pending = await LocalNotifications.getPending();
  const waterNotifications = pending.notifications
    .filter((item) => item.id >= WATER_ID_START && item.id <= WATER_ID_END)
    .map((item) => ({ id: item.id }));

  if (waterNotifications.length) {
    await LocalNotifications.cancel({ notifications: waterNotifications });
  }
}

export async function scheduleNativeWaterReminders(settings) {
  if (!isNativeApp()) {
    return { mode: 'web', count: 0 };
  }

  await cancelNativeWaterReminders();
  if (!settings.enabled) return { mode: 'native', count: 0 };

  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') {
    throw new Error('notification-permission-denied');
  }

  const times = buildReminderTimes(settings.startTime, settings.endTime, settings.intervalMinutes);
  const notifications = times.map((time, index) => ({
    id: WATER_ID_START + index,
    title: 'Hora de beber água 💧',
    body: 'Beba água agora e registre a quantidade no Treino Jhow.',
    schedule: {
      on: { hour: time.hour, minute: time.minute },
      allowWhileIdle: true,
    },
    sound: 'default',
    extra: { type: 'hydration' },
  }));

  if (notifications.length) {
    await LocalNotifications.schedule({ notifications });
  }

  return { mode: 'native', count: notifications.length };
}

export async function testNativeNotification() {
  if (!isNativeApp()) return false;

  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') {
    throw new Error('notification-permission-denied');
  }

  await LocalNotifications.schedule({
    notifications: [{
      id: WATER_ID_END,
      title: 'Teste do lembrete 💧',
      body: 'Se você ouviu o som e viu este aviso, está funcionando.',
      schedule: { at: new Date(Date.now() + 2500), allowWhileIdle: true },
      sound: 'default',
      extra: { type: 'hydration-test' },
    }],
  });

  return true;
}

export async function requestWebNotificationPermission() {
  if (!("Notification" in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export async function showWebHydrationNotification() {
  if (!("Notification" in window) || Notification.permission !== 'granted') return false;

  const options = {
    body: 'Beba água agora e registre a quantidade no Treino Jhow.',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: 'hydration-reminder',
    renotify: true,
  };

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Hora de beber água 💧', options);
    return true;
  }

  try {
    new Notification('Hora de beber água 💧', options);
    return true;
  } catch {
    return false;
  }
}
