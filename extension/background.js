// Placify Extension — Background Service Worker

const DEFAULT_SERVER_URL = 'https://placify-backend-latest.onrender.com';
const DASHBOARD_URL = 'https://placify.forex911.online';
const CHECK_INTERVAL_MINUTES = 360; // Every 6 hours
const STARTUP_DEBOUNCE_MS = 1000 * 60 * 5; // 5 minutes debounce

// Helper to open or focus the Placify calendar tab
function openOrFocusPlacify(targetUrl = `${DASHBOARD_URL}/calendar`) {
  chrome.tabs.query({}, (tabs) => {
    const existingTab = tabs.find(t => t.url && (t.url.includes('placify.forex911.online') || t.url.includes('placify.vercel.app')));
    if (existingTab && existingTab.id) {
      chrome.tabs.update(existingTab.id, { active: true, url: targetUrl });
      if (existingTab.windowId) {
        chrome.windows.update(existingTab.windowId, { focused: true });
      }
    } else {
      chrome.tabs.create({ url: targetUrl });
    }
  });
}

// Trigger desktop notification toast (Option 1)
function showDesktopNotification(title, message) {
  const notifId = 'placify-reminder-' + Date.now();
  chrome.notifications.create(notifId, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title || '🔔 Placify — Upcoming Reminders',
    message: message || 'You have upcoming calendar reminders! Click to view your calendar.',
    priority: 2,
    buttons: [
      { title: 'Open Calendar' }
    ]
  }, (createdId) => {
    if (chrome.runtime.lastError) {
      console.warn('Placify notification error:', chrome.runtime.lastError.message);
    }
  });
}

// Handle notification click (clicking body of toast)
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId && notificationId.startsWith('placify-')) {
    openOrFocusPlacify();
    chrome.notifications.clear(notificationId);
  }
});

// Handle notification action button click ("Open Calendar")
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId && notificationId.startsWith('placify-')) {
    openOrFocusPlacify();
    chrome.notifications.clear(notificationId);
  }
});

// Main check function
async function checkNotifications(options = {}) {
  const { force = false, showDesktopToast = false } = options;

  chrome.storage.local.get(['apiKey', 'serverUrl', 'lastCheckTime'], async (result) => {
    let apiKey = result.apiKey;
    let serverUrl = result.serverUrl;
    const lastCheckTime = result.lastCheckTime || 0;

    if (!apiKey) {
      const syncResult = await chrome.storage.sync.get(['apiKey', 'serverUrl']);
      apiKey = syncResult.apiKey;
      if (syncResult.serverUrl) serverUrl = syncResult.serverUrl;
    }
    serverUrl = serverUrl || DEFAULT_SERVER_URL;

    if (!apiKey) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    const now = Date.now();
    if (!force && (now - lastCheckTime < STARTUP_DEBOUNCE_MS)) {
      return; // Skip if checked very recently
    }

    try {
      const response = await fetch(`${serverUrl}/api/extension/notifications/check`, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.unreadCount || 0;

        // Update extension badge
        if (count > 0) {
          chrome.action.setBadgeText({ text: ' ' });
          chrome.action.setBadgeBackgroundColor({ color: '#ff0000' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }

        chrome.storage.local.set({ lastCheckTime: now, cachedUnreadCount: count });

        // Trigger OS notification popup on startup if unread reminders exist
        if (showDesktopToast && count > 0) {
          try {
            const listRes = await fetch(`${serverUrl}/api/extension/notifications`, {
              headers: { 'X-API-KEY': apiKey }
            });
            if (listRes.ok) {
              const notifications = await listRes.json();
              if (Array.isArray(notifications) && notifications.length > 0) {
                const latest = notifications[0];
                if (notifications.length === 1) {
                  showDesktopNotification(
                    `🔔 ${latest.title}`,
                    latest.message || 'Upcoming calendar reminder due soon. Click to open calendar.'
                  );
                } else {
                  showDesktopNotification(
                    `🔔 Placify: ${notifications.length} Upcoming Reminders`,
                    `Latest: "${latest.title}". Click to open calendar.`
                  );
                }
                return;
              }
            }
          } catch (fetchErr) {
            console.warn('Could not fetch notification details for desktop toast:', fetchErr);
          }

          // Fallback toast if notification detail list fails
          showDesktopNotification(
            '🔔 Placify — Upcoming Reminders',
            `You have ${count} pending reminder${count > 1 ? 's' : ''}! Click to open your calendar.`
          );
        }
      } else if (response.status === 401) {
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  });
}

// Force a badge refresh (called from popup)
async function forceRefreshBadge() {
  checkNotifications({ force: true, showDesktopToast: false });
}

// Trigger check & desktop notification popup on browser startup
chrome.runtime.onStartup.addListener(() => {
  checkNotifications({ force: true, showDesktopToast: true });
});

// Setup on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  checkNotifications({ force: true, showDesktopToast: false });
  chrome.alarms.create('checkNotificationsAlarm', { periodInMinutes: CHECK_INTERVAL_MINUTES });
});

// Periodic alarm check
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkNotificationsAlarm') {
    checkNotifications({ force: true, showDesktopToast: true });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'refreshBadge') {
    forceRefreshBadge();
    sendResponse({ ok: true });
  }
  if (message.type === 'updateBadge') {
    const count = message.count || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: ' ' });
      chrome.action.setBadgeBackgroundColor({ color: '#ff0000' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
    chrome.storage.local.set({ cachedUnreadCount: count });
    sendResponse({ ok: true });
  }
  return true;
});
