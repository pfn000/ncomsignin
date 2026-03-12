const HEALTH_URL = 'http://127.0.0.1:8787/health';
const EXTENSION_SESSION_BASE = 'http://127.0.0.1:8787/extension/session';

async function checkDaemon() {
  try {
    const response = await fetch(HEALTH_URL, { method: 'GET' });
    const healthy = response.ok;
    await chrome.storage.local.set({ daemonHealthy: healthy, lastCheck: Date.now() });
    chrome.action.setBadgeText({ text: healthy ? 'ON' : 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: healthy ? '#16a34a' : '#dc2626' });
  } catch {
    await chrome.storage.local.set({ daemonHealthy: false, handshakeVerified: false, lastCheck: Date.now() });
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
  }
}

function originFromUrl(urlString) {
  try {
    return new URL(urlString).origin;
  } catch {
    return '';
  }
}

async function verifySession(sessionId) {
  try {
    const response = await fetch(`${EXTENSION_SESSION_BASE}/${encodeURIComponent(sessionId)}`);
    if (!response.ok) {
      await chrome.storage.local.set({ handshakeVerified: false });
      return { ok: false, reason: `session status ${response.status}` };
    }

    const session = await response.json();
    await chrome.storage.local.set({
      handshakeVerified: !!session.active,
      verifiedSessionId: sessionId,
      trustedOrigin: session.trustedOrigin || null,
      handshakeVerifiedAt: Date.now()
    });

    return { ok: !!session.active };
  } catch {
    return { ok: false, reason: 'cannot reach local daemon' };
  }
}

async function autofillTab(tabId, url) {
  const { handshakeVerified, trustedOrigin, credentialsVault } = await chrome.storage.local.get([
    'handshakeVerified',
    'trustedOrigin',
    'credentialsVault'
  ]);

  if (!handshakeVerified) {
    return { ok: false, reason: 'handshake required' };
  }

  const origin = originFromUrl(url);
  if (!origin) {
    return { ok: false, reason: 'invalid page origin' };
  }

  if (trustedOrigin && trustedOrigin !== origin) {
    return { ok: false, reason: 'origin mismatch with trusted handshake' };
  }

  const creds = (credentialsVault || {})[origin];
  if (!creds?.username || !creds?.password) {
    return { ok: false, reason: 'no saved credentials for this site' };
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    args: [creds],
    func: (injectedCreds) => {
      const userInput =
        document.querySelector('input[type="email"]') ||
        document.querySelector('input[name="username"]') ||
        document.querySelector('input[type="text"]');
      const passInput = document.querySelector('input[type="password"]');

      if (userInput) {
        userInput.value = injectedCreds.username;
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (passInput) {
        passInput.value = injectedCreds.password;
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });

  return { ok: true };
}

chrome.runtime.onInstalled.addListener(async () => {
  chrome.alarms.create('proximity-daemon-health', { periodInMinutes: 1 });
  await chrome.storage.local.set({
    credentialsVault: {
      'https://twitter.com': { username: 'demo@example.com', password: 'change-me' }
    }
  });
  checkDaemon();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'proximity-daemon-health') {
    checkDaemon();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'VERIFY_TNS_SESSION') {
    verifySession(message.sessionId).then(sendResponse);
    return true;
  }

  if (message.type === 'AUTOFILL_ACTIVE_TAB') {
    autofillTab(message.tabId, message.url).then(sendResponse);
    return true;
  }

  return false;
});
