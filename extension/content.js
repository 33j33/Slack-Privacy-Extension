const defaultSettings = {
  enabled: true,
  blurMedia: true,
  blurLinkPreviews: true,
  blurHuddleMessages: true,
  blurPublicChannels: false,
  hoverTimeout: 1
};

let currentSettings = {...defaultSettings};

function applyPrivacySettings() {
  document.documentElement.style.setProperty('--hover-timeout', `${currentSettings.hoverTimeout}s`);
  const classesToToggle = {
    'privacy-enabled': currentSettings.enabled,
    'blur-media': currentSettings.blurMedia,
    'blur-link-previews': currentSettings.blurLinkPreviews,
    'blur-public-channels': currentSettings.blurPublicChannels,
    'blur-huddle-messages': currentSettings.blurHuddleMessages
  };
  
  Object.entries(classesToToggle).forEach(([className, enabled]) => {
    document.body.classList.toggle(className, enabled);
  });
}

async function getSettingsFromStorage() {
  try {
    const settings = await chrome.storage.sync.get(defaultSettings);
    currentSettings = settings;
    return settings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return defaultSettings;
  }
}

async function setSettingsToStorage(settings) {
  try {
    await chrome.storage.sync.set(settings);
    currentSettings = settings;
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Listen for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'settingsUpdated') {
    currentSettings = message.settings;
    applyPrivacySettings();
  }
});

// Initialize
init().catch(error => console.error('Error during initialization:', error));