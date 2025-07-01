#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// App Store screenshot requirements
const screenshotRequirements = {
  'iPhone 6.7"': {
    width: 1290,
    height: 2796,
    devices: ['iPhone 15 Pro Max', 'iPhone 14 Pro Max'],
    filename: 'iPhone_6_7_inch'
  },
  'iPhone 6.5"': {
    width: 1242,
    height: 2688,
    devices: ['iPhone 11 Pro Max', 'iPhone XS Max'],
    filename: 'iPhone_6_5_inch'
  },
  'iPhone 5.5"': {
    width: 1242,
    height: 2208,
    devices: ['iPhone 8 Plus'],
    filename: 'iPhone_5_5_inch'
  },
  'iPad Pro 12.9"': {
    width: 2048,
    height: 2732,
    devices: ['iPad Pro (12.9-inch)'],
    filename: 'iPad_Pro_12_9_inch'
  }
};

console.log('📱 App Store Screenshot Requirements:');
console.log('=====================================\n');

Object.entries(screenshotRequirements).forEach(([size, config]) => {
  console.log(`${size}:`);
  console.log(`  Dimensions: ${config.width}x${config.height}px`);
  console.log(`  Devices: ${config.devices.join(', ')}`);
  console.log(`  Filename: ${config.filename}`);
  console.log('');
});

console.log('📸 How to Generate Screenshots:');
console.log('================================\n');

console.log('1. Open iOS Simulator');
console.log('2. For each device size:');
console.log('   - Go to Device > iOS > [Device Name]');
console.log('   - Run your app: npx expo start --ios');
console.log('   - Navigate to key screens:');
console.log('     • Home screen with ingredient input');
console.log('     • Recipe results screen');
console.log('     • Recipe detail screen');
console.log('     • Favorites screen');
console.log('     • Settings/Profile screen');
console.log('   - Take screenshot: Cmd+S or Device > Screenshot');
console.log('   - Save with descriptive name like:');
console.log('     • RecipeAI_Home_6.7inch.png');
console.log('     • RecipeAI_Results_6.7inch.png');
console.log('     • RecipeAI_Detail_6.7inch.png');
console.log('');

console.log('🎯 Key Screens to Capture:');
console.log('==========================\n');

console.log('1. Home Screen - Show ingredient input and fitness goals');
console.log('2. Recipe Results - Display multiple recipe cards');
console.log('3. Recipe Detail - Show full recipe with instructions');
console.log('4. Favorites - Show saved recipes');
console.log('5. Profile/Settings - Show app customization options');
console.log('');

console.log('💡 Tips:');
console.log('=========\n');

console.log('• Use real data (not placeholder text)');
console.log('• Show the app in action with actual recipes');
console.log('• Highlight key features like AI recommendations');
console.log('• Use consistent lighting and clean backgrounds');
console.log('• Take 3-5 screenshots per device size');
console.log('• Test on actual device if possible for best quality');
console.log('');

console.log('📁 Create this folder structure:');
console.log('================================\n');

const screenshotsDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

Object.entries(screenshotRequirements).forEach(([size, config]) => {
  const deviceDir = path.join(screenshotsDir, config.filename);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  console.log(`Created: ${deviceDir}`);
});

console.log('\n✅ Screenshot directories created!');
console.log('Now take your screenshots and save them in the appropriate folders.'); 