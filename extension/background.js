// background.js
const defaultSettings = {
  enabled: true,
  blurMedia: true,
  blurLinkPreviews: true,
  blurHuddleMessages: true,
  blurPublicChannels: false,
  hoverTimeout: 1
};

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-privacy") {
    try {
      const settings = await chrome.storage.sync.get(defaultSettings);
      const updatedSettings = {
        ...settings,
        enabled: !settings.enabled
      };
      
      await chrome.storage.sync.set(updatedSettings);

      // Notify all tabs with complete settings
      const tabs = await chrome.tabs.query({ url: "https://*.slack.com/*" });
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'settingsUpdated',
          settings: updatedSettings
        });
      });
    } catch (error) {
      console.error('Error handling shortcut:', error);
    }
  }
});