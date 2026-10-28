// Placify Extension — Popup Logic (v1.3 Context-Aware)

document.addEventListener('DOMContentLoaded', async () => {
  const tabsContainer = document.getElementById('tabs-container');
  const tabs = document.querySelectorAll('.tab');
  
  const jobForm = document.getElementById('save-job-form');
  const saveJobBtn = document.getElementById('save-job-btn');
  const btnJobText = document.getElementById('btn-job-text');
  const btnJobLoader = document.getElementById('btn-job-loader');
  
  const companyInput = document.getElementById('company');
  const roleInput = document.getElementById('role');
  const locationInput = document.getElementById('location');
  const jobLinkInput = document.getElementById('job-link');

  const companyConfidence = document.getElementById('company-confidence');
  const roleConfidence = document.getElementById('role-confidence');
  const locationConfidence = document.getElementById('location-confidence');

  const extractionWidget = document.getElementById('extraction-widget');
  const extractionSpinner = document.getElementById('extraction-spinner');
  const extractionIcon = document.getElementById('extraction-icon');
  const extractionStatusText = document.getElementById('extraction-status-text');
  const reDetectBtn = document.getElementById('re-detect-btn');
  const extractionSourceRow = document.getElementById('extraction-source-row');
  const extractionSourceBadge = document.getElementById('extraction-source-badge');
  const duplicateBanner = document.getElementById('duplicate-banner');
  const duplicateBannerText = document.getElementById('duplicate-banner-text');

  const hackathonForm = document.getElementById('save-hackathon-form');
  const saveHackathonBtn = document.getElementById('save-hackathon-btn');
  const btnHackathonText = document.getElementById('btn-hackathon-text');
  const btnHackathonLoader = document.getElementById('btn-hackathon-loader');

  const calendarTabContent = document.getElementById('calendar-tab-content');
  const calendarForm = document.getElementById('save-calendar-form');
  const saveCalendarBtn = document.getElementById('save-calendar-btn');
  const btnCalendarText = document.getElementById('btn-calendar-text');
  const btnCalendarLoader = document.getElementById('btn-calendar-loader');

  const calMonthTitle = document.getElementById('cal-month-title');
  const calPrevMonthBtn = document.getElementById('cal-prev-month');
  const calNextMonthBtn = document.getElementById('cal-next-month');
  const calTodayBtn = document.getElementById('cal-today-btn');
  const calDaysGrid = document.getElementById('cal-days-grid');
  const calSelectedDayLabel = document.getElementById('cal-selected-day-label');
  const calDayCountBadge = document.getElementById('cal-day-count-badge');
  const calRemindersList = document.getElementById('cal-reminders-list');
  const calQuickAddBtn = document.getElementById('cal-quick-add-btn');
  const calAddModal = document.getElementById('cal-add-modal');
  const calModalBackdrop = document.getElementById('cal-modal-backdrop');
  const calModalClose = document.getElementById('cal-modal-close');
  const calModalCancel = document.getElementById('cal-modal-cancel');
  const calModalSubtitle = document.getElementById('cal-modal-subtitle');

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

  // Track fields the user manually typed into to prevent overwriting
  const userEditedFields = new Set();

  [companyInput, roleInput, locationInput, jobLinkInput].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      userEditedFields.add(input.id);
      // Hide auto badge when user edits
      if (input.id === 'company' && companyConfidence) companyConfidence.classList.add('hidden');
      if (input.id === 'role' && roleConfidence) roleConfidence.classList.add('hidden');
      if (input.id === 'location' && locationConfidence) locationConfidence.classList.add('hidden');
      // Re-check duplicate with updated input
      triggerDuplicateCheck();
    });
  });

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

  // ═══════════════════════════════════════════════════════════════════════
  // CONTEXT-AWARE EXTRACTION WORKFLOW
  // ═══════════════════════════════════════════════════════════════════════

  let extractionInProgress = false;

  function setExtractionUIState(state, message, platformName) {
    if (!extractionWidget) return;
    extractionWidget.classList.remove('hidden');
    extractionWidget.className = `extraction-widget ${state}`;

    if (state === 'extracting') {
      extractionSpinner.classList.remove('hidden');
      extractionIcon.classList.add('hidden');
      extractionStatusText.textContent = message || 'Analyzing this page...';
      extractionSourceRow.classList.add('hidden');
    } else {
      extractionSpinner.classList.add('hidden');
      extractionIcon.classList.remove('hidden');
      extractionStatusText.textContent = message || '';

      if (state === 'success') {
        extractionIcon.textContent = '✓';
      } else if (state === 'partial') {
        extractionIcon.textContent = '●';
      } else if (state === 'not_job') {
        extractionIcon.textContent = '✦';
      } else if (state === 'error') {
        extractionIcon.textContent = '✕';
      }

      if (platformName && state !== 'not_job' && state !== 'error') {
        extractionSourceBadge.textContent = platformName;
        extractionSourceRow.classList.remove('hidden');
      } else {
        extractionSourceRow.classList.add('hidden');
      }
    }
  }

  function setFieldConfidence(element, confidence, source) {
    if (!element) return;
    if (!confidence) {
      element.classList.add('hidden');
      return;
    }
    element.className = `confidence-tag ${confidence}`;
    element.textContent = confidence === 'high' ? 'Verified' : (confidence === 'medium' ? 'Auto' : 'Review');
    if (source) element.title = `Extracted from: ${source}`;
    element.classList.remove('hidden');
  }

  // Safe message sending with timeout
  function sendMessageWithTimeout(tabId, message, timeoutMs = 2500) {
    return new Promise((resolve, reject) => {
      let completed = false;
      const timer = setTimeout(() => {
        if (!completed) {
          completed = true;
          reject(new Error('Content script message timeout'));
        }
      }, timeoutMs);

      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (completed) return;
          completed = true;
          clearTimeout(timer);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      } catch (err) {
        if (!completed) {
          completed = true;
          clearTimeout(timer);
          reject(err);
        }
      }
    });
  }

  // Duplicate check helper
  async function triggerDuplicateCheck() {
    if (!window.PlacifyStorageHelper) return;
    const comp = companyInput.value.trim();
    const role = roleInput.value.trim();
    const link = jobLinkInput.value.trim();

    if (!comp && !link) {
      if (duplicateBanner) duplicateBanner.classList.add('hidden');
      return;
    }

    try {
      const dup = await window.PlacifyStorageHelper.checkDuplicate(comp, role, link);
      if (dup && dup.isDuplicate && duplicateBanner) {
        const text = dup.reason === 'same_link'
          ? 'Note: An application for this job URL was previously saved.'
          : `Note: You previously saved an application for ${dup.matchedRecord.role} at ${dup.matchedRecord.companyName}.`;
        duplicateBannerText.textContent = text;
        duplicateBanner.classList.remove('hidden');
      } else if (duplicateBanner) {
        duplicateBanner.classList.add('hidden');
      }
    } catch (_) {
      if (duplicateBanner) duplicateBanner.classList.add('hidden');
    }
  }

  // Apply extraction data to inputs
  function applyExtractionData(data, force = false) {
    if (!data) return;
    const { fields, status, message, platform } = data;

    if (fields) {
      // Company
      if (fields.companyName && fields.companyName.value) {
        if (force || !userEditedFields.has('company')) {
          companyInput.value = fields.companyName.value;
          setFieldConfidence(companyConfidence, fields.companyName.confidence, fields.companyName.source);
        }
      }

      // Role
      if (fields.role && fields.role.value) {
        if (force || !userEditedFields.has('role')) {
          roleInput.value = fields.role.value;
          setFieldConfidence(roleConfidence, fields.role.confidence, fields.role.source);
        }
      }

      // Location
      if (fields.location && fields.location.value) {
        if (force || !userEditedFields.has('location')) {
          locationInput.value = fields.location.value;
          setFieldConfidence(locationConfidence, fields.location.confidence, fields.location.source);
        }
      }

      // Job Link
      if (fields.jobLink && fields.jobLink.value) {
        if (force || !userEditedFields.has('job-link')) {
          jobLinkInput.value = fields.jobLink.value;
          document.getElementById('hackathon-link').value = fields.jobLink.value;
        }
      }
    }

    setExtractionUIState(status, message, platform);
    triggerDuplicateCheck();
  }

  // Core page extraction coordinator
  async function analyzeCurrentPage(force = false) {
    if (extractionInProgress) return;
    extractionInProgress = true;

    setExtractionUIState('extracting', 'Analyzing this page...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        setExtractionUIState('not_job', 'No active tab detected');
        return;
      }

      // Check restricted browser pages
      const lower = tab.url.toLowerCase();
      if (
        lower.startsWith('chrome://') ||
        lower.startsWith('chrome-extension://') ||
        lower.startsWith('edge://') ||
        lower.startsWith('about:') ||
        lower.startsWith('view-source:')
      ) {
        setExtractionUIState('not_job', 'Browser internal page. Manual entry ready.');
        if (!userEditedFields.has('job-link')) {
          jobLinkInput.value = '';
        }
        return;
      }

      // Set fallback URL initially
      if (!userEditedFields.has('job-link')) {
        jobLinkInput.value = tab.url;
        document.getElementById('hackathon-link').value = tab.url;
      }

      let extractionData = null;

      // 1. Try sending message to content script
      try {
        const response = await sendMessageWithTimeout(tab.id, { action: 'extractPageDetails' }, 1500);
        if (response && response.ok && response.data) {
          extractionData = response.data;
        }
      } catch (_) {
        // Content script not yet present; inject dynamically
        try {
          if (chrome.scripting && chrome.scripting.executeScript) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['contentScript.js']
            });

            // Re-attempt message
            const retryRes = await sendMessageWithTimeout(tab.id, { action: 'extractPageDetails' }, 2000);
            if (retryRes && retryRes.ok && retryRes.data) {
              extractionData = retryRes.data;
            }
          }
        } catch (injectErr) {
          console.warn('Script injection failed:', injectErr);
        }
      }

      if (extractionData) {
        applyExtractionData(extractionData, force);
      } else {
        setExtractionUIState('error', 'Could not analyze page. You can enter details manually.');
      }
    } catch (err) {
      console.error('Page analysis failed:', err);
      setExtractionUIState('error', 'Extraction failed. Manual entry ready.');
    } finally {
      extractionInProgress = false;
    }
  }

  // Re-detect button click
  if (reDetectBtn) {
    reDetectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      analyzeCurrentPage(true);
    });
  }

  // Trigger initial analysis on popup open
  analyzeCurrentPage(false);

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════

  let notifications = [];
  let notifPanelOpen = false;

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

  function getNotifIcon(notif) {
    const msg = (notif.message || '').toLowerCase();
    if (msg.includes('📅') || msg.includes('upcoming')) return '📅';
    if (msg.includes('deadline')) return '⏰';
    if (msg.includes('pending') || msg.includes('task')) return '📝';
    return '🔔';
  }

  async function fetchNotifications() {
    try {
      const res = await fetch(`${SERVER_URL}/api/extension/notifications`, {
        method: 'GET',
        headers: { 'X-API-KEY': apiKey }
      });

      if (res.ok) {
        notifications = await res.json();
        updateNotifUI();
        chrome.runtime.sendMessage({ type: 'updateBadge', count: notifications.length });
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }

  function updateNotifUI() {
    if (notifications.length > 0) {
      notifBadge.classList.remove('hidden');
    } else {
      notifBadge.classList.add('hidden');
    }

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

      card.querySelector('.notif-card-dismiss').addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        await dismissNotification(id);
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
          chrome.runtime.sendMessage({ type: 'updateBadge', count: notifications.length });
          if (notifications.length === 0) {
            notifBadge.classList.add('hidden');
          }
        }, 200);
      });

      notifList.appendChild(card);
    });
  }

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

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  notifBellBtn.addEventListener('click', () => {
    notifPanelOpen = !notifPanelOpen;
    if (notifPanelOpen) {
      notifPanel.classList.remove('hidden');
      fetchNotifications();
    } else {
      notifPanel.classList.add('hidden');
    }
  });

  notifDismissAll.addEventListener('click', () => {
    dismissAllNotifications();
  });

  fetchNotifications();
  chrome.runtime.sendMessage({ type: 'refreshBadge' });

  // ═══════════════════════════════════════════════════════════════════════
  // STATUS BANNER
  // ═══════════════════════════════════════════════════════════════════════

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

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      jobForm.classList.add('hidden');
      hackathonForm.classList.add('hidden');
      if (calendarTabContent) calendarTabContent.classList.add('hidden');
      if (calendarForm) calendarForm.classList.add('hidden');

      if (tab.dataset.tab === 'job') {
        jobForm.classList.remove('hidden');
      } else if (tab.dataset.tab === 'hackathon') {
        hackathonForm.classList.remove('hidden');
      } else {
        if (calendarTabContent) {
          calendarTabContent.classList.remove('hidden');
          renderCalendar();
          fetchCalendarEventsFromBackend();
        } else if (calendarForm) {
          calendarForm.classList.remove('hidden');
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // JOB FORM (IMPROVED SAVE WITH DUPLICATE PREVENTION & NORMALIZATION)
  // ═══════════════════════════════════════════════════════════════════════

  jobForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let rawCompany = companyInput.value;
    let rawRole = roleInput.value;
    let rawLocation = locationInput.value;
    let rawLink = jobLinkInput.value;

    const normalizer = window.PlacifyNormalizer;
    const company = normalizer ? normalizer.cleanCompanyName(rawCompany) : rawCompany.trim();
    const role = normalizer ? normalizer.cleanJobTitle(rawRole) : rawRole.trim();
    const location = normalizer ? normalizer.cleanLocation(rawLocation) : rawLocation.trim();
    const link = normalizer ? normalizer.normalizeUrl(rawLink) : rawLink.trim();

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

        // Record in local storage for duplicate prevention & offline tracking
        if (window.PlacifyStorageHelper) {
          await window.PlacifyStorageHelper.recordSavedApplication({
            companyName: company,
            role: role,
            location: location,
            companyLink: link
          });
        }

        // Reset inputs and edit tracking
        companyInput.value = '';
        roleInput.value = '';
        locationInput.value = '';
        userEditedFields.clear();

        if (companyConfidence) companyConfidence.classList.add('hidden');
        if (roleConfidence) roleConfidence.classList.add('hidden');
        if (locationConfidence) locationConfidence.classList.add('hidden');
        if (duplicateBanner) duplicateBanner.classList.add('hidden');
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
  // INTERACTIVE CALENDAR & REMINDERS CONTROLLER
  // ═══════════════════════════════════════════════════════════════════════

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function toLocalDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatFriendlyDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);

    const todayStr = toLocalDateStr(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toLocalDateStr(tomorrow);

    const dayName = SHORT_DAY_NAMES[dateObj.getDay()];
    const monthName = MONTH_NAMES[month].substring(0, 3);

    if (dateStr === todayStr) {
      return `Today (${dayName}, ${monthName} ${day})`;
    } else if (dateStr === tomorrowStr) {
      return `Tomorrow (${dayName}, ${monthName} ${day})`;
    }
    return `${dayName}, ${monthName} ${day}, ${year}`;
  }

  let calCurrentView = new Date();
  let calSelectedDateStr = toLocalDateStr(new Date());
  let calEvents = [];

  // Load cached calendar events from local storage immediately
  chrome.storage.local.get(['placify_calendar_events'], (res) => {
    if (res && Array.isArray(res.placify_calendar_events)) {
      calEvents = res.placify_calendar_events;
      if (calendarTabContent && !calendarTabContent.classList.contains('hidden')) {
        renderCalendar();
      }
    }
  });

  async function fetchCalendarEventsFromBackend() {
    if (!apiKey) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/extension/calendar`, {
        method: 'GET',
        headers: { 'X-API-KEY': apiKey }
      });
      if (res.ok) {
        const events = await res.json();
        if (Array.isArray(events)) {
          calEvents = events;
          chrome.storage.local.set({ placify_calendar_events: events });
          renderCalendar();
        }
      }
    } catch (err) {
      console.warn('Could not sync calendar events from backend:', err);
    }
  }

  function renderCalendar() {
    if (!calMonthTitle || !calDaysGrid) return;

    const year = calCurrentView.getFullYear();
    const month = calCurrentView.getMonth();

    // 1. Update Title
    calMonthTitle.textContent = `${MONTH_NAMES[month]} ${year}`;

    // 2. Compute date boundaries
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const todayStr = toLocalDateStr(new Date());

    calDaysGrid.innerHTML = '';

    // Index events by dateStr for O(1) lookup
    const eventsByDate = new Map();
    calEvents.forEach(evt => {
      const d = evt.eventDate;
      if (!d) return;
      if (!eventsByDate.has(d)) eventsByDate.set(d, []);
      eventsByDate.get(d).push(evt);
    });

    // 3. Helper to create a day cell
    function createDayCell(dayNum, isOutside, dateStr) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      cell.dataset.date = dateStr;

      if (isOutside) cell.classList.add('outside');
      if (dateStr === todayStr) cell.classList.add('today');
      if (dateStr === calSelectedDateStr) cell.classList.add('selected');

      const numEl = document.createElement('span');
      numEl.className = 'cal-day-num';
      numEl.textContent = dayNum;
      cell.appendChild(numEl);

      // Event dots
      const dayEvts = eventsByDate.get(dateStr) || [];
      if (dayEvts.length > 0) {
        const dotsRow = document.createElement('div');
        dotsRow.className = 'cal-dots-row';
        // Render up to 3 dots
        dayEvts.slice(0, 3).forEach(evt => {
          const dot = document.createElement('span');
          dot.className = `cal-dot ${evt.type || 'REMINDER'}`;
          dotsRow.appendChild(dot);
        });
        cell.appendChild(dotsRow);
      }

      // Tap / Double-tap detector
      let lastTapTime = 0;
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        const now = Date.now();
        const diff = now - lastTapTime;

        if (diff > 0 && diff < 350) {
          // DOUBLE TAP DETECTED!
          selectDate(dateStr);
          openAddReminderModal(dateStr);
        } else {
          // Single tap: select date & show reminders
          selectDate(dateStr);
        }
        lastTapTime = now;
      });

      // Native dblclick for desktop mouse users
      cell.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectDate(dateStr);
        openAddReminderModal(dateStr);
      });

      return cell;
    }

    // Previous month filler
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, dayNum);
      calDaysGrid.appendChild(createDayCell(dayNum, true, toLocalDateStr(prevDate)));
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const currDate = new Date(year, month, d);
      calDaysGrid.appendChild(createDayCell(d, false, toLocalDateStr(currDate)));
    }

    // Next month filler to complete full weeks
    const totalCells = calDaysGrid.children.length;
    const remaining = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      calDaysGrid.appendChild(createDayCell(d, true, toLocalDateStr(nextDate)));
    }

    renderRemindersForSelectedDate();
  }

  function selectDate(dateStr) {
    calSelectedDateStr = dateStr;
    // Update active highlight
    const cells = calDaysGrid.querySelectorAll('.cal-day-cell');
    cells.forEach(c => {
      if (c.dataset.date === dateStr) {
        c.classList.add('selected');
      } else {
        c.classList.remove('selected');
      }
    });
    renderRemindersForSelectedDate();
  }

  function renderRemindersForSelectedDate() {
    if (!calSelectedDayLabel || !calRemindersList) return;

    calSelectedDayLabel.textContent = formatFriendlyDate(calSelectedDateStr);

    const matching = calEvents.filter(e => e.eventDate === calSelectedDateStr);
    if (calDayCountBadge) {
      calDayCountBadge.textContent = matching.length;
    }

    calRemindersList.innerHTML = '';

    if (matching.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'cal-empty-reminders';
      empty.innerHTML = `
        <span>No reminders for this day.</span>
        <button type="button" class="cal-empty-reminders-action">+ Add reminder</button>
      `;
      empty.querySelector('.cal-empty-reminders-action').addEventListener('click', () => {
        openAddReminderModal(calSelectedDateStr);
      });
      calRemindersList.appendChild(empty);
      return;
    }

    matching.forEach(evt => {
      const card = document.createElement('div');
      card.className = 'cal-reminder-card';
      const typeStr = evt.type || 'REMINDER';
      const notifyDays = evt.notifyDaysBefore || 1;

      card.innerHTML = `
        <div class="cal-reminder-card-left">
          <div class="cal-reminder-card-top">
            <span class="cal-type-tag ${typeStr}">${typeStr}</span>
            <span class="cal-reminder-card-title">${escapeHtml(evt.title)}</span>
          </div>
          <div class="cal-reminder-card-meta">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.7;">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span>Notify ${notifyDays}d before</span>
          </div>
        </div>
        <button type="button" class="cal-reminder-del-btn" title="Delete Reminder">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      card.querySelector('.cal-reminder-del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCalendarReminder(evt.id);
      });

      calRemindersList.appendChild(card);
    });
  }

  function openAddReminderModal(dateStr) {
    if (!calAddModal) return;
    const targetDate = dateStr || calSelectedDateStr || toLocalDateStr(new Date());
    document.getElementById('cal-date').value = targetDate;
    document.getElementById('cal-title').value = '';
    document.getElementById('cal-notify').value = '1';
    document.getElementById('cal-type').value = 'REMINDER';

    if (calModalSubtitle) {
      calModalSubtitle.textContent = `For ${formatFriendlyDate(targetDate)}`;
    }

    calAddModal.classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('cal-title').focus();
    }, 50);
  }

  function closeAddReminderModal() {
    if (calAddModal) calAddModal.classList.add('hidden');
  }

  async function deleteCalendarReminder(id) {
    if (!id) return;
    // Optimistic delete
    calEvents = calEvents.filter(e => String(e.id) !== String(id));
    chrome.storage.local.set({ placify_calendar_events: calEvents });
    renderCalendar();

    showStatus('success', 'Reminder removed.');

    if (!apiKey) return;
    try {
      await fetch(`${SERVER_URL}/api/extension/calendar/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-KEY': apiKey }
      });
    } catch (err) {
      console.warn('Could not delete reminder from server:', err);
    }
  }

  // Nav buttons
  if (calPrevMonthBtn) {
    calPrevMonthBtn.addEventListener('click', () => {
      calCurrentView.setMonth(calCurrentView.getMonth() - 1);
      renderCalendar();
    });
  }

  if (calNextMonthBtn) {
    calNextMonthBtn.addEventListener('click', () => {
      calCurrentView.setMonth(calCurrentView.getMonth() + 1);
      renderCalendar();
    });
  }

  if (calTodayBtn) {
    calTodayBtn.addEventListener('click', () => {
      calCurrentView = new Date();
      calSelectedDateStr = toLocalDateStr(new Date());
      renderCalendar();
    });
  }

  if (calQuickAddBtn) {
    calQuickAddBtn.addEventListener('click', () => {
      openAddReminderModal(calSelectedDateStr);
    });
  }

  if (calModalClose) calModalClose.addEventListener('click', closeAddReminderModal);
  if (calModalCancel) calModalCancel.addEventListener('click', closeAddReminderModal);
  if (calModalBackdrop) calModalBackdrop.addEventListener('click', closeAddReminderModal);

  // Form submit handler
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

    const newReminder = {
      id: Date.now(),
      title,
      eventDate: date,
      type,
      notifyDaysBefore: notify
    };

    // Optimistically add locally
    calEvents.push(newReminder);
    chrome.storage.local.set({ placify_calendar_events: calEvents });
    calSelectedDateStr = date;
    renderCalendar();
    closeAddReminderModal();

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
        const serverData = await res.json().catch(() => null);
        if (serverData && serverData.id) {
          // Replace optimistic ID with server ID
          const idx = calEvents.findIndex(e => e.id === newReminder.id);
          if (idx !== -1) {
            calEvents[idx] = serverData;
            chrome.storage.local.set({ placify_calendar_events: calEvents });
            renderCalendar();
          }
        }
      } else {
        const err = await res.text();
        showStatus('error', `Saved locally. Server notice: ${err || res.statusText}`);
      }
    } catch (err) {
      showStatus('success', 'Saved reminder locally.');
    } finally {
      saveCalendarBtn.disabled = false;
      btnCalendarText.textContent = 'Save Reminder';
      btnCalendarLoader.classList.add('hidden');
    }
  });
});
