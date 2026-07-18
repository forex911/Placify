// Placify Extension — Options Page Logic

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settings-form');
  const serverUrlInput = document.getElementById('server-url');
  const apiKeyInput = document.getElementById('api-key');
  const statusEl = document.getElementById('status');

  // Load existing config
  const config = await chrome.storage.sync.get(['apiKey', 'serverUrl']);
  if (config.serverUrl) serverUrlInput.value = config.serverUrl;
  if (config.apiKey) apiKeyInput.value = config.apiKey;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const serverUrl = serverUrlInput.value.trim().replace(/\/+$/, '');
    const apiKey = apiKeyInput.value.trim();

    if (!serverUrl || !apiKey) return;

    await chrome.storage.sync.set({ serverUrl, apiKey });

    statusEl.textContent = '✓ Settings saved successfully!';
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  });
});
