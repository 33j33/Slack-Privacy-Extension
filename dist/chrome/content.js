"use strict";
((browserAPI) => {
    const LOG_PREFIX = "content.js";
    const defaultSettings = {
        enabled: true,
        blurMedia: true,
        blurLinkPreviews: true,
        blurHuddleMessages: true,
        blurPublicChannels: false,
        blurReactionsBar: true,
        hoverTimeout: 1
    };
    const defaultSettingsKeys = Object.keys(defaultSettings);
    let currentSettings = defaultSettings;
    function applyPrivacySettings() {
        document.documentElement.style.setProperty('--hover-timeout', `${currentSettings.hoverTimeout}s`);
        const classesToToggle = {
            'privacy-enabled': currentSettings.enabled,
            'blur-media': currentSettings.blurMedia,
            'blur-link-previews': currentSettings.blurLinkPreviews,
            'blur-public-channels': currentSettings.blurPublicChannels,
            'blur-huddle-messages': currentSettings.blurHuddleMessages,
            'blur-reactions-bar': currentSettings.blurReactionsBar
        };
        Object.entries(classesToToggle).forEach(([className, enabled]) => {
            document.body.classList.toggle(className, enabled);
        });
    }
    async function init() {
        try {
            const settings = await browserAPI.storage.local.get(defaultSettingsKeys);
            // browserAPI.storage.local.get() returns an empty object {} when no settings exist
            const hasExistingSettings = Object.keys(settings).length > 0;
            if (hasExistingSettings) {
                currentSettings = Object.assign(Object.assign({}, defaultSettings), settings);
                console.log(`${LOG_PREFIX}::init::Loaded existing settings`, currentSettings);
            }
            else {
                // No settings found in storage, use defaults and save them
                currentSettings = defaultSettings;
                await browserAPI.storage.local.set(defaultSettings);
                console.log(`${LOG_PREFIX}::init::No settings found, applied defaults`, currentSettings);
            }
            // Apply the settings to the slack body
            applyPrivacySettings();
        }
        catch (error) {
            console.error(`${LOG_PREFIX}::init::Error initializing`, error);
            // Fallback to defaults in case of error
            currentSettings = defaultSettings;
            // Apply the settings to the slack body
            applyPrivacySettings();
        }
    }
    // initialising 
    init().then(() => {
        console.log(`${LOG_PREFIX}::initialised successfully`);
    });
    // Listen for settings updates
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'settingsUpdated') {
            currentSettings = message.settings;
            applyPrivacySettings();
        }
    });
})(chrome); // chrome is compatible with both Firefox and Chrome
