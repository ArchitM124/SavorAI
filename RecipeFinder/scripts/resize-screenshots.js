#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Screenshot dimensions
const sourceDimensions = {
  width: 1290,  // iPhone 15 Pro Max (6.7")
  height: 2796
};

const targetDimensions = {
  width: 1242,  // iPhone 8 Plus (5.5")
  height: 2208
};

console.log('📱 Screenshot Resizer for App Store');
console.log('====================================');
console.log(`Source: ${sourceDimensions.width}x${sourceDimensions.height} (6.7")`);
console.log(`Target: ${targetDimensions.width}x${targetDimensions.height} (5.5")`);
console.log('');

// Create target directory if it doesn't exist
const targetDir = path.join(__dirname, '../screenshots/iPhone_5_5_inch');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`✅ Created directory: ${targetDir}`);
}

console.log('📋 Instructions:');
console.log('1. Take screenshots from your iPhone 15 Pro Max simulator');
console.log('2. Save them in the screenshots/iPhone_6_7_inch/ directory');
console.log('3. Run this script to resize them to 5.5" dimensions');
console.log('');
console.log('💡 Tip: Use Cmd+S in the simulator to take screenshots');
console.log('💡 Tip: Screenshots are saved to your Desktop by default');
console.log('');

// Check if source directory exists
const sourceDir = path.join(__dirname, '../screenshots/iPhone_6_7_inch');
if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir).filter(file => 
    file.match(/\.(png|jpg|jpeg)$/i)
  );
  
  if (files.length > 0) {
    console.log(`📸 Found ${files.length} screenshots to resize:`);
    files.forEach(file => console.log(`   - ${file}`));
    console.log('');
    console.log('🔄 To resize, run:');
    console.log('   node scripts/resize-screenshots.js');
  } else {
    console.log('❌ No screenshots found in iPhone_6_7_inch directory');
  }
} else {
  console.log('❌ iPhone_6_7_inch directory not found');
  console.log('   Create it and add your 6.7" screenshots first');
}

console.log('');
console.log('🎯 Key screens to capture:');
console.log('   1. Home Screen - Ingredient input and fitness goals');
console.log('   2. Recipe Results - Multiple recipe cards with nutrition');
console.log('   3. Recipe Detail - Full recipe with instructions');
console.log('   4. Favorites - Saved recipes list');
console.log('   5. Settings/Profile - App customization'); 