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

const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

// Listeners
browserAPI.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-privacy") {
    console.log(`${LOG_PREFIX}::browserAPI.commands.onCommand.addListener::toggle-privacy triggered`)
    try {
      const settings = await browserAPI.storage.local.get(defaultSettingsKeys);
      const hasExistingSettings = Object.keys(settings).length > 0;
      if (hasExistingSettings) {
        currentSettings = { ...defaultSettings, ...settings }
      } else {
        currentSettings = defaultSettings
      }
      const updatedSettings = {
        ...currentSettings,
        enabled: !currentSettings.enabled
      };
      
      await browserAPI.storage.local.set(updatedSettings);

      // Update the icon based on the new settings (for keyboard shortcut)
      await updateIcon();

      // To send messages to content scripts, we require `tabs.sendMessage`
      // as background.js cannot send messages to content scripts `runtime.sendMessage`
      // Notify all tabs with complete settings
      const tabs = await browserAPI.tabs.query({ url: "https://*.slack.com/*" });
      tabs.forEach(tab => {
        browserAPI.tabs.sendMessage(tab.id, {
          type: 'settingsUpdated',
          settings: updatedSettings
        });
      });

      // Popup.js doesn't receive messages sent via `tabs.sendMessage`. 
      // hence sending the update via `runtime.sendMessage` 
      browserAPI.runtime.sendMessage({
        type: "settingsUpdated",
        settings: updatedSettings
      });
    } catch (error) {
      console.error(`${LOG_PREFIX}::browserAPI.commands.onCommand.addListener::Error handling shortcut key`, error);
    }
  }
});

browserAPI.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    // Fix - changes not applied to slack when extension is installed
    // Browser does not automatically load content scripts into tabs that are already open when an extension is installed.
    console.log(`${LOG_PREFIX}::onInstalled::first time installation, setting default values`);
    
    
    // Find all existing Slack tabs
    const tabs = await browserAPI.tabs.query({ url: "https://*.slack.com/*" });
    
    // Inject content script and CSS into each existing tab
    for (const tab of tabs) {
      try {
        await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        await browserAPI.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles.css']
        });
      } catch (error) {
        console.error(`${LOG_PREFIX}::onInstalled::Error injecting scripts, refresh the tab ${tab.id}`, error);
      }
    }
  }
});

browserAPI.runtime.onStartup.addListener(async () => {
  try {
    // Initialize icon state
    await updateIcon();
  }
  catch (error) {
    console.error(`${LOG_PREFIX}::onStartup::Error initializing icon`, error);
  }
});

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'settingsUpdated') {
    updateIcon()
      .then(() => {
        if (sendResponse) sendResponse({ success: true });
      })
      .catch(error => {
        console.error(`${LOG_PREFIX}::Error updating icon from popup:`, error);
        if (sendResponse) sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

// Icon state management
const updateIcon = async () => {
  const settings = await browserAPI.storage.local.get(defaultSettingsKeys);
  const enabled = settings.enabled;

  await browserAPI.action.setIcon({
    path: {
      '12': enabled ? 'hidden12.png' : 'shown12.png',
      '16': enabled ? 'hidden16.png' : 'shown16.png',
      '32': enabled ? 'hidden32.png' : 'shown32.png',
      '48': enabled ? 'hidden48.png' : 'shown48.png',
      '64': enabled ? 'hidden64.png' : 'shown64.png',
      '128': enabled ? 'hidden128.png' : 'shown128.png'
    },
  });

  await browserAPI.action.setTitle({
    title: enabled ? 'Privacy Mode Enabled' : 'Privacy Mode Disabled'
  });
};