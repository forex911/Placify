const DEFAULT_SERVER_URL = 'https://placify-backend-latest.onrender.com';
const CHECK_INTERVAL_MINUTES = 360; // Every 6 hours
const RATE_LIMIT_MS = 1000 * 60 * 60 * 4; // Minimum 4 hours between startup checks

async function checkNotifications() {
  chrome.storage.local.get(['apiKey', 'serverUrl', 'lastCheckTime'], async (result) => {
    const apiKey = result.apiKey;
    const serverUrl = result.serverUrl || DEFAULT_SERVER_URL;
    const lastCheckTime = result.lastCheckTime || 0;
    
    if (!apiKey) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    // Rate limit: If we checked very recently, don't hit the server again
    const now = Date.now();
    if (now - lastCheckTime < RATE_LIMIT_MS) {
      return; // Skip server hit, we checked recently
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

        if (count > 0) {
          chrome.action.setBadgeText({ text: count > 9 ? '9+' : count.toString() });
          chrome.action.setBadgeBackgroundColor({ color: '#ff0000' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
        
        // Save the successful check time
        chrome.storage.local.set({ lastCheckTime: now });
      } else if (response.status === 401) {
        // If unauthorized, clear the badge and stop trying until API key is fixed
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  });
}

// Check on startup (rate-limited by the check logic)
chrome.runtime.onStartup.addListener(() => {
  checkNotifications();
});

// Check on install/update
chrome.runtime.onInstalled.addListener(() => {
  checkNotifications();
  // Set up a conservative alarm (every 6 hours)
  // Calendar reminders are daily, so high-frequency polling is unnecessary
  chrome.alarms.create('checkNotificationsAlarm', { periodInMinutes: CHECK_INTERVAL_MINUTES });
});

// Check when alarm triggers
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkNotificationsAlarm') {
    // Force a check ignoring the startup rate limit
    chrome.storage.local.set({ lastCheckTime: 0 }, () => {
      checkNotifications();
    });
  }
});
