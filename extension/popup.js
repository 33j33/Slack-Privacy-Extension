const LOG_PREFIX = "popup.js"
const defaultSettings = {
  enabled: true,
  blurMedia: true,
  blurLinkPreviews: true,
  blurHuddleMessages: true,
  blurPublicChannels: false,
  hoverTimeout: 1
};

const defaultSettingsKeys = Object.keys(defaultSettings)

let currentSettings = {};

document.addEventListener('DOMContentLoaded', () => {

  // show appropriate shortcut based on platform os
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  if (isMac) {
    document.getElementById('windowsShortcut').style.display = "none";
  } else {
    document.getElementById('macShortcut').style.display = "none";

  }

  const mainToggle = document.getElementById('mainToggle');
  const mediaToggle = document.getElementById('mediaToggle');
  const linkToggle = document.getElementById('linkToggle');
  const hoverTimeout = document.getElementById('hoverTimeout');
  const settingsPanel = document.getElementById('settingsPanel');
  const publicChannelsToggle = document.getElementById('publicChannelsToggle')
  const huddleMessagesToggle = document.getElementById('huddleMessagesToggle')

  // Load saved settings
  chrome.storage.local.get(defaultSettingsKeys, (settings) => {
    if (chrome.runtime.lastError) {
      // Error handling
      console.error(`${LOG_PREFIX}::chrome.storage.local.get::onError`, chrome.runtime.lastError);
      return;
    }

    if (settings) {
      currentSettings = { ...defaultSettings, ...settings };
    } else {
      currentSettings = defaultSettings;
    }

    mainToggle.checked = currentSettings.enabled;
    mediaToggle.checked = currentSettings.blurMedia;
    linkToggle.checked = currentSettings.blurLinkPreviews;
    hoverTimeout.value = currentSettings.hoverTimeout || 0;
    publicChannelsToggle.checked = currentSettings.blurPublicChannels;
    huddleMessagesToggle.checked = currentSettings.blurHuddleMessages;
    settingsPanel.style.display = currentSettings.enabled ? 'block' : 'none';
  });

  // Save settings and notify content script
  const saveSettings = () => {
    const settings = {
      enabled: mainToggle.checked,
      blurMedia: mediaToggle.checked,
      blurLinkPreviews: linkToggle.checked,
      blurPublicChannels: publicChannelsToggle.checked,
      blurHuddleMessages: huddleMessagesToggle.checked,
      hoverTimeout: parseFloat(hoverTimeout.value)
    };

    chrome.storage.local.set(settings);

    currentSettings = settings
    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'settingsUpdated',
          settings
        });
      }
    });
  };

  // Event listeners
  mainToggle.addEventListener('change', () => {
    settingsPanel.style.display = mainToggle.checked ? 'block' : 'none';
    saveSettings();
  });

  [mediaToggle, linkToggle, publicChannelsToggle, huddleMessagesToggle].forEach(toggle => {
    toggle.addEventListener('change', saveSettings);
  });

  hoverTimeout.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (value >= 0 && value <= 10) {
      saveSettings();
    }
  });
});

