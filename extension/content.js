const LOG_PREFIX = "content.js"
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


async function init() {
  try {
    const settings = await chrome.storage.local.get(defaultSettingsKeys);
    // chrome.storage.local.get() returns an empty object {} when no settings exist
    
    const hasExistingSettings = Object.keys(settings).length > 0;
    
    if (hasExistingSettings) {
      currentSettings = { ...defaultSettings, ...settings };
      console.log(`${LOG_PREFIX}::init::Loaded existing settings`, currentSettings);
    } else {
      // No settings found in storage, use defaults and save them
      currentSettings = defaultSettings;
      await chrome.storage.local.set(defaultSettings);
      console.log(`${LOG_PREFIX}::init::No settings found, applied defaults`, currentSettings);
    }
    
    // Apply the settings to the page
    applyPrivacySettings();
  } catch (error) {
    console.error(`${LOG_PREFIX}::init::Error initializing`, error);
    // Fallback to defaults in case of error
    currentSettings = defaultSettings;
    applyPrivacySettings();
  }
}


// initialising 
init().then(() => {
  console.log(`${LOG_PREFIX}::init`)
})


// Listen for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'settingsUpdated') {
    currentSettings = message.settings;
    applyPrivacySettings();
  }
});