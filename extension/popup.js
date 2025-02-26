const LOG_PREFIX = "popup.js"
const defaultSettings = {
  enabled: true,
  blurMedia: true,
  blurLinkPreviews: true,
  blurHuddleMessages: true,
  blurPublicChannels: false,
  blurReactionsBar: true,
  hoverTimeout: 1
};

const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;


const defaultSettingsKeys = Object.keys(defaultSettings)

let currentSettings = {};

document.addEventListener('DOMContentLoaded', async () => {

  // show appropriate shortcut based on platform os
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  if (isMac) {
    document.getElementById('windowsShortcut').style.display = "none";
  } else {
    document.getElementById('macShortcut').style.display = "none";
  }

  // Get current shortcut key from browser API
  try {
    const commands = await browserAPI.commands.getAll();
    const toggleCommand = commands.find(cmd => cmd.name === "toggle-privacy");

    if (toggleCommand && toggleCommand.shortcut) {
      const macShortcutKey = document.getElementById('macShortcutKey');
      const windowsShortcutKey = document.getElementById('windowsShortcutKey');
      if (macShortcutKey) macShortcutKey.innerHTML = toggleCommand.shortcut;
      if (windowsShortcutKey) windowsShortcutKey.innerHTML = toggleCommand.shortcut;
    }

  } catch (error) {
    console.error(`${LOG_PREFIX}::Failed to get command shortcuts`, error);
  }

  const mainToggle = document.getElementById('mainToggle');
  const mediaToggle = document.getElementById('mediaToggle');
  const linkToggle = document.getElementById('linkToggle');
  const hoverTimeout = document.getElementById('hoverTimeout');
  const settingsPanel = document.getElementById('settingsPanel');
  const publicChannelsToggle = document.getElementById('publicChannelsToggle')
  const huddleMessagesToggle = document.getElementById('huddleMessagesToggle')
  const reactionBarToggle = document.getElementById('reactionBarToggle')


  // Load saved settings
  const settings = await browserAPI.storage.local.get(defaultSettingsKeys);

  const hasExistingSettings = Object.keys(settings).length > 0;

  if (hasExistingSettings) {
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
  reactionBarToggle.checked = currentSettings.blurReactionsBar;
  settingsPanel.style.display = currentSettings.enabled ? 'block' : 'none';

  // Save settings and notify content script
  const saveSettings = () => {
    const settings = {
      enabled: mainToggle.checked,
      blurMedia: mediaToggle.checked,
      blurLinkPreviews: linkToggle.checked,
      blurPublicChannels: publicChannelsToggle.checked,
      blurHuddleMessages: huddleMessagesToggle.checked,
      blurReactionsBar: reactionBarToggle.checked,
      hoverTimeout: parseFloat(hoverTimeout.value)
    };

    browserAPI.storage.local.set(settings);

    currentSettings = settings
    // Notify content script
    browserAPI.tabs.query({ url: "https://*.slack.com/*" }, (tabs) => {
      tabs.forEach(tab => {
        browserAPI.tabs.sendMessage(tab.id, {
          type: 'settingsUpdated',
          settings
        });
      });
    });
  };

  // Event listeners
  mainToggle.addEventListener('change', () => {
    settingsPanel.style.display = mainToggle.checked ? 'block' : 'none';
    saveSettings();
  });

  [mediaToggle, linkToggle, publicChannelsToggle, huddleMessagesToggle, reactionBarToggle].forEach(toggle => {
    toggle.addEventListener('change', saveSettings);
  });

  hoverTimeout.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (value >= 0 && value <= 10) {
      saveSettings();
    }
  });

  // Listen for settings updates
  browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'settingsUpdated') {
      const settings = message.settings
      if (settings.enabled !== undefined && settings.enabled !== null) {
        const mainToggle = document.getElementById('mainToggle');
        const settingsPanel = document.getElementById('settingsPanel');

        currentSettings = { ...currentSettings, enabled: settings.enabled }
        
        if (mainToggle) {
          mainToggle.checked = currentSettings.enabled;
        }

        if (settingsPanel) {
          settingsPanel.style.display = currentSettings.enabled ? 'block' : 'none';
        }
      }
    }
  });
});

