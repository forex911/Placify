const DEFAULT_SERVER_URL = 'https://placify-backend-latest.onrender.com';
const CHECK_INTERVAL_MINUTES = 360; // Every 6 hours
const RATE_LIMIT_MS = 1000 * 60 * 60; // Minimum 1 hour between startup checks

async function checkNotifications() {
  chrome.storage.local.get(['apiKey', 'serverUrl', 'lastCheckTime'], async (result) => {
    // Try local first, fallback to sync (options.js saves to sync)
    let apiKey = result.apiKey;
    const serverUrl = result.serverUrl || DEFAULT_SERVER_URL;
    const lastCheckTime = result.lastCheckTime || 0;

    if (!apiKey) {
      // Fallback: check sync storage
      const syncResult = await chrome.storage.sync.get(['apiKey']);
      apiKey = syncResult.apiKey;
      if (!apiKey) {
        chrome.action.setBadgeText({ text: '' });
        return;
      }
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
          chrome.action.setBadgeText({ text: ' ' });
          chrome.action.setBadgeBackgroundColor({ color: '#ff0000' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
        
        // Save the successful check time and count
        chrome.storage.local.set({ lastCheckTime: now, cachedUnreadCount: count });
      } else if (response.status === 401) {
        // If unauthorized, clear the badge and stop trying until API key is fixed
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  });
}

// Force a badge refresh (bypasses rate limit) — called from popup
async function forceRefreshBadge() {
  chrome.storage.local.set({ lastCheckTime: 0 }, () => {
    checkNotifications();
  });
}

// Check on startup (rate-limited by the check logic)
chrome.runtime.onStartup.addListener(() => {
  checkNotifications();
});

// Check on install/update
chrome.runtime.onInstalled.addListener(() => {
  checkNotifications();
  // Set up alarm (every 6 hours)
  chrome.alarms.create('checkNotificationsAlarm', { periodInMinutes: CHECK_INTERVAL_MINUTES });
});

// Check when alarm triggers
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkNotificationsAlarm') {
    // Force a check ignoring the startup rate limit
    forceRefreshBadge();
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
  return true; // Keep message channel open for async
});
