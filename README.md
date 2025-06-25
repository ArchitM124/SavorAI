# Recipe Finder

A web application that helps users find recipes based on their available ingredients and fitness goals. The application uses ChatGPT to generate personalized recipe recommendations that take into account the user's fitness objectives (bulking, cutting, maintaining, or building muscle) and suggests appropriate recipes that can be made with the ingredients they have on hand.

## Features

- Input available ingredients with quantities and units
- Select fitness goals (bulking, cutting, maintaining, building muscle)
- Get AI-powered personalized recipe recommendations
- Receive detailed nutritional information for each recipe
- Modern, responsive user interface
- Real-time ingredient management

## Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your environment variables:
   - Create a `.env` file in the root directory
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```
   - You can get an API key from [OpenAI's website](https://platform.openai.com/api-keys)

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
Recipe-Finder/
├── app.py              # Main Flask application with ChatGPT integration
├── requirements.txt    # Python dependencies
├── .env               # Environment variables (API keys)
├── static/
│   ├── style.css      # Custom CSS styles
│   └── script.js      # Frontend JavaScript
├── templates/
│   └── index.html     # Main HTML template
└── README.md          # Project documentation
```

## Technologies Used

- Backend: Python, Flask
- AI: OpenAI GPT-4/GPT-3.5
- Frontend: HTML5, CSS3, JavaScript
- UI Framework: Bootstrap 5

## Important Notes

- The application uses OpenAI's GPT models to generate recipe recommendations
- Make sure to keep your API key secure and never commit it to version control
- The application will generate recipes based on the ingredients you have and your fitness goals
- Each recipe comes with detailed nutritional information and cooking instructions

## Contributing

Feel free to submit issues and enhancement requests! 