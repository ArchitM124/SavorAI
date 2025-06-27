# Recipe Finder App Development Summary

## Changes Made

### 1. Backend Conversion (Flask to FastAPI)
- Converted Flask web app to FastAPI backend API
- Removed web-specific components (templates, static files)
- Added proper data models using Pydantic
- Added CORS support for mobile app
- Improved error handling and validation

### 2. API Endpoints
- POST `/recipes` - Get recipe suggestions
  - Takes ingredients, fitness goals, meal type
  - Returns 3 recipe suggestions
- GET `/rate-limit` - Check API usage limits
  - Shows daily and hourly limits
  - Shows time until reset

### 3. Dependencies
Updated requirements.txt with:
```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.4.2
openai==0.28.1
python-dotenv==1.0.1
requests==2.31.0
```

## Next Steps

### On Mac:
1. Clone the repository:
```bash
git clone https://github.com/ArchitM124/Website.git
```

2. Create new React Native app:
```bash
npx create-expo-app RecipeFinder
cd RecipeFinder
```

3. Install dependencies:
```bash
npm install @react-navigation/native @react-navigation/native-stack axios react-native-safe-area-context react-native-screens
```

### Project Structure
The project now has two parts:
1. Backend API (Python/FastAPI) - Handles recipe generation
2. Mobile App (React Native) - Will handle user interface

### Important Notes
- Backend runs on port 8000
- OpenAI API key needed in .env file
- CORS is enabled for mobile app access
- Rate limiting is implemented (50 daily, 5 hourly requests)

## Troubleshooting
If you encounter "pod install" issues:
1. Install CocoaPods: `sudo gem install cocoapods`
2. Navigate to ios directory: `cd ios`
3. Run: `pod install`

## Commands Reference
### Backend (in Website directory)
```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Mobile App (in RecipeFinder directory)
```bash
# Start the app
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
``` 