// Placify Extension — Options Page Logic

const SERVER_URL = 'https://placify-backend-latest.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settings-form');
  const apiKeyInput = document.getElementById('api-key');
  const statusEl = document.getElementById('status');

  // Load existing config
  const config = await chrome.storage.sync.get(['apiKey']);
  if (config.apiKey) apiKeyInput.value = config.apiKey;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return;

    await chrome.storage.sync.set({ serverUrl: SERVER_URL, apiKey });

    statusEl.textContent = '✓ Settings saved successfully!';
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  });
});
