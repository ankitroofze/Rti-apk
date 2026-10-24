/* eslint-disable */
// Firebase Cloud Messaging service worker (web push).
// Ye file site ke root par serve honi chahiye: <basePath>/firebase-messaging-sw.js
// Firebase config page se query-string me aati hai (utils/Pushnotifications.web.js register karte waqt bhejta hai).

// 1) Click handler PEHLE register karo, taaki Firebase ke default handler se pehle chale.
self.addEventListener('notificationclick', function (event) {
  event.stopImmediatePropagation();
  event.notification.close();

  var n = event.notification.data || {};
  // FCM auto-display wali notification me payload n.FCM_MSG.data me hota hai; page se dikhayi me seedha n me.
  var data = (n.FCM_MSG && n.FCM_MSG.data) || n || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url.indexOf(self.registration.scope) === 0 && 'focus' in c) {
          c.postMessage({ type: 'PUSH_CLICK', data: data });
          return c.focus();
        }
      }
      // Koi tab open nahi -> naya tab, data URL me; app start par bootstrap isse padh ke sahi screen kholega
      return self.clients.openWindow(
        self.registration.scope + '?push=' + encodeURIComponent(JSON.stringify(data))
      );
    })
  );
});

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

// 2) Firebase
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

var params = new URL(self.location.href).searchParams;
var config = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
};

if (config.apiKey && config.messagingSenderId) {
  firebase.initializeApp(config);
  var messaging = firebase.messaging();

  // "notification" block wale messages Firebase khud dikhata hai.
  // Sirf data-only messages ke liye yahan manually dikhate hain.
  messaging.onBackgroundMessage(function (payload) {
    if (payload.notification) return;
    var d = payload.data || {};
    if (!d.title && !d.body) return;
    return self.registration.showNotification(d.title || 'RTI Voice', {
      body: d.body || '',
      icon: d.icon || undefined,
      data: d,
      tag: d.notification_id || undefined,
    });
  });
}