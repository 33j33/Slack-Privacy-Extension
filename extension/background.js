const LOG_PREFIX = "background.js"

const defaultSettings = {
  enabled: true,
  blurMedia: true,
  blurLinkPreviews: true,
  blurHuddleMessages: true,
  blurPublicChannels: false,
  blurReactionsBar: true,
  hoverTimeout: 1
};


const defaultSettingsKeys = Object.keys(defaultSettings)

let currentSettings = {};

// Listeners
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

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // Fix - changes not applied to slack when extension is installed
    // Chrome does not automatically load content scripts into tabs that are already open when an extension is installed.
    console.log(`${LOG_PREFIX}::onInstalled::first time installation, setting default values`);
    
    
    // Find all existing Slack tabs
    const tabs = await chrome.tabs.query({ url: "https://*.slack.com/*" });
    
    // Inject content script and CSS into each existing tab
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles.css']
        });
      } catch (error) {
        console.error(`${LOG_PREFIX}::onInstalled::Error injecting scripts, refresh the tab ${tab.id}`, error);
      }
    }
  }
});