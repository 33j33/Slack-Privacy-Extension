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
  chrome.storage.sync.get({
    enabled: true,
    blurMedia: true,
    blurLinkPreviews: true,
    blurHuddleMessages: true,
    blurPublicChannels: false,
    hoverTimeout: 1
  }, (settings) => {
    mainToggle.checked = settings.enabled;
    mediaToggle.checked = settings.blurMedia;
    linkToggle.checked = settings.blurLinkPreviews;
    hoverTimeout.value = settings.hoverTimeout;
    publicChannelsToggle.checked = settings.blurPublicChannels;
    huddleMessagesToggle.checked = settings.blurHuddleMessages;
    settingsPanel.style.display = settings.enabled ? 'block' : 'none';
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

    chrome.storage.sync.set(settings);
    
    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'settingsUpdated',
        settings
      });
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

