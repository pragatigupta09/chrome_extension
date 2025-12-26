const BACKEND_URL = 'http://localhost:3000';

const LINKEDIN_PATTERN = /^https?:\/\/(www\.)?linkedin\.com\/in\/[^\/]+/;
const INSTAGRAM_PATTERN = /^https?:\/\/(www\.)?instagram\.com\/[^\/]+/;

const statusEl = document.getElementById('status');
const currentUrlEl = document.getElementById('currentUrl');
const platformBadgeEl = document.getElementById('platformBadge');
const sendButton = document.getElementById('sendButton');
const resultsEl = document.getElementById('results');
const resultsContentEl = document.getElementById('resultsContent');

async function init() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      showStatus('No active tab found', 'error');
      sendButton.disabled = true;
      return;
    }

    const url = tab.url;
    currentUrlEl.textContent = url;

    if (LINKEDIN_PATTERN.test(url)) {
      showPlatformBadge('LinkedIn', 'linkedin');
      sendButton.disabled = false;
    } else if (INSTAGRAM_PATTERN.test(url)) {
      showPlatformBadge('Instagram', 'instagram');
      sendButton.disabled = false;
    } else {
      showPlatformBadge('Unsupported Page', 'unsupported');
      showStatus('This extension only works on LinkedIn and Instagram profile pages.', 'error');
      sendButton.disabled = true;
      return;
    }

    sendButton.addEventListener('click', () => handleSendPage(tab.id));
  } catch (error) {
    console.error('Initialization error:', error);
    showStatus('Error initializing extension: ' + error.message, 'error');
    sendButton.disabled = true;
  }
}

function showPlatformBadge(text, platform) {
  platformBadgeEl.innerHTML = `<span class="platform-badge ${platform}">${text}</span>`;
}

function showStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = `status ${type} show`;
  
  if (type === 'success') {
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 5000);
  }
}

function hideStatus() {
  statusEl.classList.remove('show');
}

async function handleSendPage(tabId) {
  try {
    sendButton.disabled = true;
    hideStatus();
    showStatus('Capturing page HTML...', 'info');

    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: capturePageHTML
    });

    if (!results || !results[0] || !results[0].result) {
      throw new Error('Failed to capture page HTML');
    }

    const { url, html } = results[0].result;

    showStatus('Sending to backend...', 'info');

    const response = await fetch(`${BACKEND_URL}/scrape-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, html })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    showStatus('Successfully scraped profile data!', 'success');
    displayResults(data);
    sendButton.disabled = false;

  } catch (error) {
    console.error('Error sending page:', error);
    showStatus('Error: ' + error.message, 'error');
    sendButton.disabled = false;
  }
}

function capturePageHTML() {
  return {
    url: window.location.href,
    html: document.documentElement.outerHTML
  };
}

function displayResults(data) {
  resultsContentEl.textContent = JSON.stringify(data, null, 2);
  resultsEl.classList.add('show');
}

init();


