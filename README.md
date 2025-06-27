# Recipe Finder Mobile App

A React Native mobile application that helps users find recipes based on available ingredients and fitness goals.

## Features

- Search recipes by ingredients
- Filter recipes by fitness goals
- Detailed recipe information including:
  - Ingredients list
  - Preparation instructions
  - Nutritional information
  - Preparation time
- Expandable recipe cards
- Clean and modern UI

## Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- React Native development environment setup
- For iOS development:
  - macOS
  - Xcode
  - CocoaPods
- For Android development:
  - Android Studio
  - Android SDK
  - Java Development Kit (JDK)

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd RecipeFinderApp
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies (macOS only):
```bash
cd ios
pod install
cd ..
```

4. Create a `.env` file in the root directory with the following content:
```
API_URL=your_api_url_here
OPENAI_API_KEY=your_openai_api_key_here
```

## Running the App

### iOS (macOS only)
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Development

The app is built with:
- React Native
- TypeScript
- React Navigation
- Axios for API calls
- Environment variables for configuration

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── screens/        # Screen components
  ├── services/       # API and other services
  ├── hooks/          # Custom React hooks
  └── utils/          # Utility functions and constants
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 