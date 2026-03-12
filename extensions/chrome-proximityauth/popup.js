const stateNode = document.getElementById('state');
const updated = document.getElementById('updated');
const sessionInput = document.getElementById('sessionId');

const updateState = async () => {
  const { daemonHealthy, lastCheck, handshakeVerified } = await chrome.storage.local.get([
    'daemonHealthy',
    'lastCheck',
    'handshakeVerified'
  ]);

  stateNode.textContent = daemonHealthy
    ? handshakeVerified
      ? 'Online + Handshake Verified'
      : 'Online'
    : 'Offline';

  updated.textContent = lastCheck ? `Last check: ${new Date(lastCheck).toLocaleString()}` : '';
};

document.getElementById('verify').addEventListener('click', async () => {
  const sessionId = sessionInput.value.trim();
  if (!sessionId) {
    updated.textContent = 'Provide session id from daemon fallback verification.';
    return;
  }

  const response = await chrome.runtime.sendMessage({ type: 'VERIFY_TNS_SESSION', sessionId });
  updated.textContent = response?.ok
    ? 'Handshake verified. Autofill is unlocked for 30s.'
    : `Handshake failed: ${response?.reason || 'unknown error'}`;
  await updateState();
});

document.getElementById('autofill').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    updated.textContent = 'No active tab.';
    return;
  }

  const response = await chrome.runtime.sendMessage({ type: 'AUTOFILL_ACTIVE_TAB', tabId: tab.id, url: tab.url });
  updated.textContent = response?.ok ? 'Autofill sent to page.' : `Autofill blocked: ${response?.reason || 'unknown'}`;
});

updateState();
