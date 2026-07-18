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

  // Handle Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      if (tab.dataset.tab === 'job') {
        jobForm.classList.remove('hidden');
        hackathonForm.classList.add('hidden');
      } else {
        jobForm.classList.add('hidden');
        hackathonForm.classList.remove('hidden');
      }
    });
  });

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
});
