#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📱 Recipe AI - App Store Preparation Guide\n');

console.log('🎯 Required Steps:');
console.log('1. ✅ Apple Developer Registration ($99/year)');
console.log('2. ✅ App Store Connect Setup');
console.log('3. 📸 App Store Assets');
console.log('4. 🏗️  Production Build');
console.log('5. 📤 Submit to App Store\n');

console.log('📸 Required App Store Assets:');
console.log('- App Icon: 1024x1024 PNG');
console.log('- Screenshots:');
console.log('  • iPhone 6.7" (1290x2796)');
console.log('  • iPhone 6.5" (1242x2688)');
console.log('  • iPhone 5.5" (1242x2208)');
console.log('  • iPad Pro 12.9" (2048x2732)\n');

console.log('📝 App Store Metadata:');
console.log('- App Name: Recipe AI');
console.log('- Subtitle: AI-Powered Recipe Finder');
console.log('- Description: AI-powered recipe finder that creates personalized meal plans based on your ingredients, fitness goals, and dietary preferences. Get instant recipe suggestions with nutritional information and cooking instructions.');
console.log('- Keywords: recipe, ai, cooking, meal planning, fitness, nutrition, food, diet');
console.log('- Category: Food & Drink');
console.log('- Content Rating: 4+ (No objectionable content)');
console.log('- Price: Free\n');

console.log('🚀 Next Steps:');
console.log('1. Complete Apple Developer registration');
console.log('2. Create App Store Connect listing');
console.log('3. Prepare screenshots and app icon');
console.log('4. Run: eas build --platform ios --profile production');
console.log('5. Run: eas submit --platform ios');
console.log('6. Submit for App Store review\n');

console.log('📚 Useful Links:');
console.log('- Apple Developer: https://developer.apple.com/register/');
console.log('- App Store Connect: https://appstoreconnect.apple.com');
console.log('- EAS Build Docs: https://docs.expo.dev/build/introduction');
console.log('- App Store Guidelines: https://developer.apple.com/app-store/review/guidelines/'); 