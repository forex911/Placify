// Placify Extension — Popup Logic

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('save-form');
  const saveBtn = document.getElementById('save-btn');
  const btnText = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');
  const statusBanner = document.getElementById('status-banner');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const noConfig = document.getElementById('no-config');
  const settingsBtn = document.getElementById('settings-btn');
  const openSettingsBtn = document.getElementById('open-settings');

  // Open settings
  const openOptions = () => chrome.runtime.openOptionsPage();
  settingsBtn.addEventListener('click', openOptions);
  openSettingsBtn.addEventListener('click', openOptions);

  // Load saved config
  const config = await chrome.storage.sync.get(['apiKey', 'serverUrl']);
  const apiKey = config.apiKey || '';
  const serverUrl = config.serverUrl || '';

  if (!apiKey || !serverUrl) {
    form.classList.add('hidden');
    noConfig.classList.remove('hidden');
    return;
  }

  // Auto-fill the job link with current tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && !tab.url.startsWith('chrome://')) {
      document.getElementById('link').value = tab.url;
    }
  } catch (e) {
    console.warn('Could not get current tab URL', e);
  }

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

  // Handle form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const company = document.getElementById('company').value.trim();
    const role = document.getElementById('role').value.trim();
    const location = document.getElementById('location').value.trim();
    const link = document.getElementById('link').value.trim();

    if (!company || !role) {
      showStatus('error', 'Company Name and Role are required.');
      return;
    }

    // Disable button, show loader
    saveBtn.disabled = true;
    btnText.textContent = 'Saving...';
    btnLoader.classList.remove('hidden');

    try {
      const url = serverUrl.replace(/\/+$/, '');
      const res = await fetch(`${url}/api/extension/applications`, {
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
        showStatus('success', 'Application saved to Placify!');
        // Clear fields except the link
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
      saveBtn.disabled = false;
      btnText.textContent = 'Save Application';
      btnLoader.classList.add('hidden');
    }
  });
});
