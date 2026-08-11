// NaijaRide Service Worker — supports push notifications & basic caching.
// In production this would receive FCM messages from the server.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Receive push events (when granted permission and a server pushes).
self.addEventListener("push", (event) => {
  let payload = { title: "NaijaRide", body: "You have a new update." };
  try {
    if (event.data) payload = event.data.json();
  } catch (err) {
    console.warn("[sw] push payload parse failed", err);
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/logo.svg",
      badge: "/logo.svg",
    }),
  );
});

// Click → focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const focused = clients.find((c) => c.focused);
      if (focused) return focused.focus();
      if (self.clients.openWindow) return self.clients.openWindow("/");
    }),
  );
});
