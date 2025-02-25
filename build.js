const fs = require('fs');
const path = require('path');

const PLATFORMS = {
    chrome: "chrome",
    firefox: "firefox"
}

// Determine which platforms to build for
const args = process.argv.slice(2);
const buildPlatforms = args.length > 0 ? args : Object.values(PLATFORMS); // Default to both

// Read the source manifest.json from the extension folder
const sourceManifestPath = path.join('extension', 'manifest.json');
let sourceManifest;

try {
  const sourceManifestContent = fs.readFileSync(sourceManifestPath, 'utf8');
  sourceManifest = JSON.parse(sourceManifestContent);
  console.log('Successfully read source manifest.json');
} catch (error) {
  console.error('Error reading source manifest.json:', error);
  process.exit(1);
}

// Function to build platform-specific manifests
function buildManifest(platform) {
  const manifestCopy = JSON.parse(JSON.stringify(sourceManifest)); // Deep copy
  
  if (platform === PLATFORMS.chrome) {
    // For Chrome: Remove Firefox-specific properties
    if (manifestCopy.browser_specific_settings) {
      delete manifestCopy.browser_specific_settings;
    }
    
    // Ensure background uses service_worker format for Chrome
    if (manifestCopy.background && manifestCopy.background.scripts) {
      const scriptName = manifestCopy.background.scripts[0];
      manifestCopy.background = {
        service_worker: scriptName
      };
    }
    
    
  } else if (platform === PLATFORMS.firefox) {
    // For Firefox: Ensure Firefox-specific properties are present
    
    // Make sure browser_specific_settings exists
    if (!manifestCopy.browser_specific_settings) {
      manifestCopy.browser_specific_settings = {
        "gecko": {
          "id": "{6d7b3235-9168-464e-b422-bca4944f9f8b}",
          "strict_min_version": "122.0"
        }
      };
    }
    
    // Ensure background scripts array format for Firefox
    if (manifestCopy.background && manifestCopy.background.service_worker) {
      const scriptName = manifestCopy.background.service_worker;
      manifestCopy.background = {
        scripts: [scriptName]
      };
    }
    
    // Firefox doesn't support global commands
    if (manifestCopy.commands) {
      // Loop through all commands and remove the 'global' flag which is not supported in Firefox
      Object.keys(manifestCopy.commands).forEach(commandName => {
        if (manifestCopy.commands[commandName] && manifestCopy.commands[commandName].global) {
          delete manifestCopy.commands[commandName].global;
        }
      });
    }
  }
  
  return manifestCopy;
}


// Ensure build directories exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build for each platform
buildPlatforms.forEach(platform => {
  if (platform !== PLATFORMS.chrome && platform !== PLATFORMS.firefox) {
    console.log(`Unknown platform: ${platform}, skipping`);
    return;
  }
  
  // Create platform directory if it doesn't exist
  const platformDir = path.join('dist', platform);
  if (!fs.existsSync(platformDir)) {
    fs.mkdirSync(platformDir);
  }
  
  // Generate and write the platform-specific manifest
  const platformManifest = buildManifest(platform);
  fs.writeFileSync(
    path.join(platformDir, 'manifest.json'), 
    JSON.stringify(platformManifest, null, 2)
  );
  
  console.log(`Created manifest.json for ${platform} build`);
  
  // Copy other extension files
  const extensionDir = path.resolve('extension');
  const files = fs.readdirSync(extensionDir);
  
  files.forEach(file => {
    // Skip manifest.json as we're creating platform-specific versions
    if (file === 'manifest.json') return;
    
    const sourcePath = path.join(extensionDir, file);
    const targetPath = path.join(platformDir, file);
    
    // Skip directories for now
    if (fs.statSync(sourcePath).isDirectory()) {
      console.log(`Skipping directory: ${file}`);
      return;
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${file} to ${targetPath} for ${platform} build`);
  });
  
  console.log(`Build completed for ${platform}`);
});

console.log('Build/s completed successfully!');