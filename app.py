from flask import Flask, render_template, request, jsonify
import openai
from dotenv import load_dotenv
import os
import json
from typing import Dict, Any, Union, List, Tuple, Callable
from datetime import datetime, timedelta

# Global rate limit tracking
rate_limits: Dict[str, Dict[str, Any]] = {}

def check_rate_limit(ip: str) -> bool:
    now = datetime.now()
    if ip not in rate_limits:
        rate_limits[ip] = {
            'daily': {'count': 0, 'reset': now + timedelta(days=1)},
            'hourly': {'count': 0, 'reset': now + timedelta(hours=1)}
        }
    
    # Reset counters if time expired
    if now >= rate_limits[ip]['daily']['reset']:
        rate_limits[ip]['daily'] = {'count': 0, 'reset': now + timedelta(days=1)}
    if now >= rate_limits[ip]['hourly']['reset']:
        rate_limits[ip]['hourly'] = {'count': 0, 'reset': now + timedelta(hours=1)}
    
    # Check limits
    if (rate_limits[ip]['daily']['count'] >= 50 or 
        rate_limits[ip]['hourly']['count'] >= 5):
        return False
    
    # Increment counters
    rate_limits[ip]['daily']['count'] += 1
    rate_limits[ip]['hourly']['count'] += 1
    return True

# Load environment variables
load_dotenv()

# Check for API key
if not os.getenv('OPENAI_API_KEY'):
    raise ValueError("No OpenAI API key found. Please set the OPENAI_API_KEY environment variable.")

app = Flask(__name__)
openai.api_key = os.getenv('OPENAI_API_KEY')

def generate_recipes(data: Dict[str, Any], is_more: bool = False, allow_extra_ingredients: bool = False) -> Union[Dict[str, Any], Tuple[Dict[str, str], int]]:
    try:
        fitness_goal = data.get('fitness_goal')
        meal_type = data.get('meal_type')
        ingredients = data.get('ingredients', [])
        max_cooking_time = data.get('max_cooking_time')
        
        # Format ingredients for prompt
        ingredients_text = "\n".join([
            f"- {ing['name']}" + 
            (f" ({ing['quantity']} {ing['unit']})" if ing.get('quantity') and ing.get('unit') else "")
            for ing in ingredients
        ])

        cooking_time_text = f"\nMaximum Cooking Time: {max_cooking_time} minutes" if max_cooking_time else ""
        
        extra_ingredients_text = ""
        if allow_extra_ingredients:
            extra_ingredients_text = "\nIMPORTANT: If you cannot create recipes with only the listed ingredients, you may suggest recipes that require up to 2-3 additional common ingredients. If you do this, clearly mark the additional required ingredients at the start of the recipe description."
        elif is_more:
            extra_ingredients_text = "\nIMPORTANT: Create different recipes than before, but using the same ingredients."

        # Build the prompt
        prompt = f"""As a professional chef and nutritionist, create 3 healthy recipes based on these requirements:

Fitness Goal: {fitness_goal}
Meal Type: {meal_type}{cooking_time_text}

Available Ingredients:
{ingredients_text}
(Basic ingredients like salt, pepper, oil, etc. are assumed available){extra_ingredients_text}

For each recipe, provide:
1. Recipe name
2. Brief description
3. Complete ingredients list with measurements
4. Step-by-step instructions
5. Nutritional information (calories, protein, carbs, fats)
6. Brief explanation of how this recipe supports the fitness goal
7. Total cooking time (including prep time)

Return the response as a JSON array where each recipe has this exact structure:
{{
    "name": "Recipe Name",
    "description": "Brief description",
    "ingredients": ["Ingredient 1 with amount", "Ingredient 2 with amount"],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "nutrition": {{
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number
    }},
    "goal_alignment": "Explanation of how recipe supports fitness goal",
    "cooking_time": number,
    "prep_time": number
}}

{"" if not max_cooking_time else f'IMPORTANT: Each recipe must take {max_cooking_time} minutes or less to prepare and cook.'}
Ensure the response is a valid JSON array of exactly 3 recipes with the structure above."""

        # Get completion from OpenAI
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional chef and nutritionist. Always respond with properly formatted JSON arrays containing exactly 3 recipes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        # Extract the content from the response
        content = ""
        if isinstance(response, dict) and 'choices' in response:
            first_choice = response['choices'][0]
            if isinstance(first_choice, dict) and 'message' in first_choice:
                content = first_choice['message'].get('content', '')
            else:
                raise ValueError("Unexpected response format from OpenAI API")
        else:
            raise ValueError("Invalid response format from OpenAI API")

        # Parse the response and return recipes
        recipes = json.loads(content)
        return {"recipes": recipes, "has_extra_ingredients": allow_extra_ingredients}

    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {str(e)}")
        print(f"Raw response: {content if 'content' in locals() else 'No content available'}")
        return {"error": "Failed to parse recipe data. Please try again."}, 500
    except Exception as e:
        print(f"Error: {str(e)}")
        return {"error": str(e)}, 500

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_recipes', methods=['POST'])
def get_recipes():
    try:
        # Check rate limit
        client_ip = request.remote_addr or 'unknown'
        if not check_rate_limit(client_ip):
            retry_after = int((rate_limits[client_ip]['hourly']['reset'] - datetime.now()).total_seconds())
            return jsonify({
                "error": "Rate limit exceeded",
                "message": "Too many requests",
                "retry_after": retry_after
            }), 429

        data = request.get_json()
        is_more = data.pop('is_more', False)
        allow_extra_ingredients = data.pop('allow_extra_ingredients', False)
        
        # First try with exact ingredients
        result = generate_recipes(data, is_more=is_more, allow_extra_ingredients=allow_extra_ingredients)
        
        # If there's an error about not enough ingredients and we haven't tried with extra ingredients yet
        if isinstance(result, tuple) and len(result) == 2 and result[1] == 500:
            error_msg = result[0].get("error", "")
            if isinstance(error_msg, str) and "ingredients" in error_msg.lower() and not allow_extra_ingredients:
                # Try again allowing extra ingredients
                result = generate_recipes(data, is_more=False, allow_extra_ingredients=True)
        
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/rate_limit', methods=['GET'])
def get_rate_limit():
    try:
        client_ip = request.remote_addr or 'unknown'
        if client_ip not in rate_limits:
            return jsonify({
                "daily": {"remaining": 50, "reset_in": 86400},
                "hourly": {"remaining": 5, "reset_in": 3600}
            })
        
        now = datetime.now()
        daily = rate_limits[client_ip]['daily']
        hourly = rate_limits[client_ip]['hourly']
        
        return jsonify({
            "daily": {
                "remaining": max(0, 50 - daily['count']),
                "reset_in": int((daily['reset'] - now).total_seconds())
            },
            "hourly": {
                "remaining": max(0, 5 - hourly['count']),
                "reset_in": int((hourly['reset'] - now).total_seconds())
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 