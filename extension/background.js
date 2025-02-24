const LOG_PREFIX = "background.js"

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


chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-privacy") {
    console.log(`${LOG_PREFIX}::chrome.commands.onCommand.addListener::toggle-privacy triggered`)
    try {
      const settings = await chrome.storage.local.get(defaultSettingsKeys);
      if (settings) {
        currentSettings = { ...defaultSettings, ...settings }
      } else {
        currentSettings = defaultSettings
      }
      const updatedSettings = {
        ...currentSettings,
        enabled: !currentSettings.enabled
      };
      
      await chrome.storage.local.set(updatedSettings);

      // Notify all tabs with complete settings
      const tabs = await chrome.tabs.query({ url: "https://*.slack.com/*" });
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'settingsUpdated',
          settings: updatedSettings
        });
      });
    } catch (error) {
      console.error(`${LOG_PREFIX}::chrome.commands.onCommand.addListener::Error handling shortcut key`, error);
    }
  }
});