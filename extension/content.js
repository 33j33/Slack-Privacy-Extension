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
  const settings = await chrome.storage.local.get(defaultSettingsKeys);
  if (settings) {
    currentSettings = { ...defaultSettings, ...settings }
  } else {
    currentSettings = defaultSettings
  }
  applyPrivacySettings()
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