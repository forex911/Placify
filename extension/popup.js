// Placify Extension — Popup Logic

document.addEventListener('DOMContentLoaded', async () => {
  const tabsContainer = document.getElementById('tabs-container');
  const tabs = document.querySelectorAll('.tab');
  
  const jobForm = document.getElementById('save-job-form');
  const saveJobBtn = document.getElementById('save-job-btn');
  const btnJobText = document.getElementById('btn-job-text');
  const btnJobLoader = document.getElementById('btn-job-loader');
  
  const hackathonForm = document.getElementById('save-hackathon-form');
  const saveHackathonBtn = document.getElementById('save-hackathon-btn');
  const btnHackathonText = document.getElementById('btn-hackathon-text');
  const btnHackathonLoader = document.getElementById('btn-hackathon-loader');

  const calendarForm = document.getElementById('save-calendar-form');
  const saveCalendarBtn = document.getElementById('save-calendar-btn');
  const btnCalendarText = document.getElementById('btn-calendar-text');
  const btnCalendarLoader = document.getElementById('btn-calendar-loader');

  const statusBanner = document.getElementById('status-banner');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const noConfig = document.getElementById('no-config');
  const settingsBtn = document.getElementById('settings-btn');
  const openSettingsBtn = document.getElementById('open-settings');

  // Notification elements
  const notifBellBtn = document.getElementById('notif-bell-btn');
  const notifBadge = document.getElementById('notif-badge');
  const notifPanel = document.getElementById('notif-panel');
  const notifList = document.getElementById('notif-list');
  const notifEmpty = document.getElementById('notif-empty');
  const notifDismissAll = document.getElementById('notif-dismiss-all');

  // Open settings
  const openOptions = () => chrome.runtime.openOptionsPage();
  settingsBtn.addEventListener('click', openOptions);
  openSettingsBtn.addEventListener('click', openOptions);

  const openPlacifyBtn = document.getElementById('open-placify');
  if (openPlacifyBtn) {
    openPlacifyBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://placify.forex911.online/' }); 
    });
  }

  const SERVER_URL = 'https://placify-backend-latest.onrender.com';

  // Load saved config
  const config = await chrome.storage.sync.get(['apiKey']);
  const apiKey = config.apiKey || '';

  if (!apiKey) {
    jobForm.classList.add('hidden');
    hackathonForm.classList.add('hidden');
    tabsContainer.classList.add('hidden');
    noConfig.classList.remove('hidden');
    return;
  } else {
    tabsContainer.classList.remove('hidden');
  }

  // Auto-fill the job link with current tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && !tab.url.startsWith('chrome://')) {
      document.getElementById('job-link').value = tab.url;
      document.getElementById('hackathon-link').value = tab.url;
    }
  } catch (e) {
    console.warn('Could not get current tab URL', e);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════

  let notifications = [];
  let notifPanelOpen = false;

  // Relative time formatter
  function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  // Get notification icon based on type/message
  function getNotifIcon(notif) {
    const msg = (notif.message || '').toLowerCase();
    if (msg.includes('📅') || msg.includes('upcoming')) return '📅';
    if (msg.includes('deadline')) return '⏰';
    if (msg.includes('pending') || msg.includes('task')) return '📝';
    return '🔔';
  }

  // Fetch notifications from server
  async function fetchNotifications() {
    try {
      const res = await fetch(`${SERVER_URL}/api/extension/notifications`, {
        method: 'GET',
        headers: { 'X-API-KEY': apiKey }
      });

      if (res.ok) {
        notifications = await res.json();
        updateNotifUI();
        // Update badge via background
        chrome.runtime.sendMessage({ type: 'updateBadge', count: notifications.length });
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }

  // Render notification UI
  function updateNotifUI() {
    // Update bell badge
    if (notifications.length > 0) {
      notifBadge.classList.remove('hidden');
    } else {
      notifBadge.classList.add('hidden');
    }

    // Update panel content
    notifList.innerHTML = '';

    if (notifications.length === 0) {
      notifEmpty.classList.remove('hidden');
      notifDismissAll.classList.add('hidden');
      return;
    }

    notifEmpty.classList.add('hidden');
    notifDismissAll.classList.remove('hidden');

    notifications.forEach(notif => {
      const card = document.createElement('div');
      card.className = 'notif-card';
      card.innerHTML = `
        <div class="notif-card-icon">${getNotifIcon(notif)}</div>
        <div class="notif-card-body">
          <div class="notif-card-message">${escapeHtml(notif.message)}</div>
          <div class="notif-card-time">${formatRelativeTime(notif.createdAt)}</div>
        </div>
        <button class="notif-card-dismiss" data-id="${notif.id}" title="Dismiss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      // Dismiss single notification
      card.querySelector('.notif-card-dismiss').addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        await dismissNotification(id);
        // Animate removal
        card.style.transition = 'opacity 0.2s, transform 0.2s';
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
        setTimeout(() => {
          card.remove();
          notifications = notifications.filter(n => String(n.id) !== String(id));
          if (notifications.length === 0) {
            notifEmpty.classList.remove('hidden');
            notifDismissAll.classList.add('hidden');
          }
          // Update badge
          chrome.runtime.sendMessage({ type: 'updateBadge', count: notifications.length });
          // Update bell badge
          if (notifications.length === 0) {
            notifBadge.classList.add('hidden');
          }
        }, 200);
      });

      notifList.appendChild(card);
    });
  }

  // Dismiss a single notification
  async function dismissNotification(id) {
    try {
      await fetch(`${SERVER_URL}/api/extension/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'X-API-KEY': apiKey }
      });
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  }

  // Dismiss all notifications
  async function dismissAllNotifications() {
    try {
      await fetch(`${SERVER_URL}/api/extension/notifications/read-all`, {
        method: 'PUT',
        headers: { 'X-API-KEY': apiKey }
      });
      notifications = [];
      updateNotifUI();
      chrome.runtime.sendMessage({ type: 'updateBadge', count: 0 });
    } catch (err) {
      console.error('Failed to dismiss all notifications:', err);
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Toggle notification panel
  notifBellBtn.addEventListener('click', () => {
    notifPanelOpen = !notifPanelOpen;
    if (notifPanelOpen) {
      notifPanel.classList.remove('hidden');
      fetchNotifications(); // Refresh on open
    } else {
      notifPanel.classList.add('hidden');
    }
  });

  // Dismiss all button
  notifDismissAll.addEventListener('click', () => {
    dismissAllNotifications();
  });

  // Fetch notifications on popup open (for badge)
  fetchNotifications();

  // Also trigger background badge refresh
  chrome.runtime.sendMessage({ type: 'refreshBadge' });

  // ═══════════════════════════════════════════════════════════════════════
  // STATUS BANNER
  // ═══════════════════════════════════════════════════════════════════════

  // Show status banner
  function showStatus(type, message) {
    statusBanner.className = `status-banner ${type}`;
    statusIcon.textContent = type === 'success' ? '✓' : '✕';
    statusText.textContent = message;
    statusBanner.classList.remove('hidden');

    setTimeout(() => {
      statusBanner.classList.add('hidden');
    }, 4000);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TABS
  // ═══════════════════════════════════════════════════════════════════════

  // Handle Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      jobForm.classList.add('hidden');
      hackathonForm.classList.add('hidden');
      calendarForm.classList.add('hidden');

      if (tab.dataset.tab === 'job') {
        jobForm.classList.remove('hidden');
      } else if (tab.dataset.tab === 'hackathon') {
        hackathonForm.classList.remove('hidden');
      } else {
        calendarForm.classList.remove('hidden');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // JOB FORM
  // ═══════════════════════════════════════════════════════════════════════

  // Handle Job form submit
  jobForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const company = document.getElementById('company').value.trim();
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim();
    const link = document.getElementById('job-link').value.trim();

    if (!company || !role) {
      showStatus('error', 'Company Name and Role are required.');
      return;
    }

    saveJobBtn.disabled = true;
    btnJobText.textContent = 'Saving...';
    btnJobLoader.classList.remove('hidden');

    try {
      const res = await fetch(`${SERVER_URL}/api/extension/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify({
          companyName: company,
          role: role,
          location: location || null,
          companyLink: link || null,
        }),
      });

      if (res.ok) {
        showStatus('success', 'Job saved to Placify!');
        document.getElementById('company').value = '';
        document.getElementById('role').value = '';
        document.getElementById('location').value = '';
      } else {
        const err = await res.text();
        showStatus('error', `Failed: ${err || res.statusText}`);
      }
    } catch (err) {
      showStatus('error', `Network error: ${err.message}`);
    } finally {
      saveJobBtn.disabled = false;
      btnJobText.textContent = 'Save Application';
      btnJobLoader.classList.add('hidden');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // HACKATHON FORM
  // ═══════════════════════════════════════════════════════════════════════

  // Handle Hackathon form submit
  hackathonForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('hackathon-name').value.trim();
    const project = document.getElementById('project-title').value.trim();
    const link = document.getElementById('hackathon-link').value.trim();

    if (!name || !project) {
      showStatus('error', 'Hackathon Name and Project are required.');
      return;
    }

    saveHackathonBtn.disabled = true;
    btnHackathonText.textContent = 'Saving...';
    btnHackathonLoader.classList.remove('hidden');

    try {
      const res = await fetch(`${SERVER_URL}/api/extension/hackathons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify({
          hackathonName: name,
          projectTitle: project,
          projectLink: link || null,
        }),
      });

      if (res.ok) {
        showStatus('success', 'Hackathon saved to Placify!');
        document.getElementById('hackathon-name').value = '';
        document.getElementById('project-title').value = '';
      } else {
        const err = await res.text();
        showStatus('error', `Failed: ${err || res.statusText}`);
      }
    } catch (err) {
      showStatus('error', `Network error: ${err.message}`);
    } finally {
      saveHackathonBtn.disabled = false;
      btnHackathonText.textContent = 'Save Hackathon';
      btnHackathonLoader.classList.add('hidden');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CALENDAR FORM
  // ═══════════════════════════════════════════════════════════════════════

  // Handle Calendar form submit
  calendarForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('cal-title').value.trim();
    const date  = document.getElementById('cal-date').value;
    const type  = document.getElementById('cal-type').value;
    const notify = parseInt(document.getElementById('cal-notify').value, 10) || 1;

    if (!title) {
      showStatus('error', 'Event title is required.');
      return;
    }
    if (!date) {
      showStatus('error', 'Event date is required.');
      return;
    }

    saveCalendarBtn.disabled = true;
    btnCalendarText.textContent = 'Saving…';
    btnCalendarLoader.classList.remove('hidden');

    try {
      const res = await fetch(`${SERVER_URL}/api/extension/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify({
          title,
          eventDate: date,
          type,
          notifyDaysBefore: notify,
        }),
      });

      if (res.ok) {
        showStatus('success', 'Event added to Placify Calendar!');
        document.getElementById('cal-title').value = '';
        document.getElementById('cal-date').value = '';
        document.getElementById('cal-notify').value = '1';
      } else {
        const err = await res.text();
        showStatus('error', `Failed: ${err || res.statusText}`);
      }
    } catch (err) {
      showStatus('error', `Network error: ${err.message}`);
    } finally {
      saveCalendarBtn.disabled = false;
      btnCalendarText.textContent = 'Add to Calendar';
      btnCalendarLoader.classList.add('hidden');
    }
  });
});
