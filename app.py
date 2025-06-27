from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import openai
from openai.openai_object import OpenAIObject
from dotenv import load_dotenv
import os
import json
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Check for API key
if not os.getenv('OPENAI_API_KEY'):
    raise ValueError("No OpenAI API key found. Please set the OPENAI_API_KEY environment variable.")

app = FastAPI(title="Recipe Finder API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

openai.api_key = os.getenv('OPENAI_API_KEY')

# Rate limit tracking
rate_limits: Dict[str, Dict[str, Any]] = {}

class Ingredient(BaseModel):
    name: str
    quantity: Optional[str] = None
    unit: Optional[str] = None

class RecipeRequest(BaseModel):
    ingredients: List[Ingredient]
    fitness_goal: Optional[str] = None
    meal_type: Optional[str] = None
    max_cooking_time: Optional[int] = None
    is_more: bool = False
    allow_extra_ingredients: bool = False

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

def generate_recipes(data: RecipeRequest) -> Dict[str, Any]:
    try:
        # Format ingredients for prompt
        ingredients_text = "\n".join([
            f"- {ing.name}" + 
            (f" ({ing.quantity} {ing.unit})" if ing.quantity and ing.unit else "")
            for ing in data.ingredients
        ])

        cooking_time_text = f"\nMaximum Cooking Time: {data.max_cooking_time} minutes" if data.max_cooking_time else ""
        
        extra_ingredients_text = ""
        if data.allow_extra_ingredients:
            extra_ingredients_text = "\nIMPORTANT: If you cannot create recipes with only the listed ingredients, you may suggest recipes that require up to 2-3 additional common ingredients. If you do this, clearly mark the additional required ingredients at the start of the recipe description."
        elif data.is_more:
            extra_ingredients_text = "\nIMPORTANT: Create different recipes than before, but using the same ingredients."

        # Build the prompt
        prompt = f"""As a professional chef and nutritionist, create 3 healthy recipes based on these requirements:

Fitness Goal: {data.fitness_goal or 'Not specified'}
Meal Type: {data.meal_type or 'Any'}{cooking_time_text}

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

{"" if not data.max_cooking_time else f'IMPORTANT: Each recipe must take {data.max_cooking_time} minutes or less to prepare and cook.'}
Ensure the response is a valid JSON array of exactly 3 recipes with the structure above."""

        # Get completion from OpenAI
        response: OpenAIObject = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional chef and nutritionist. Always respond with properly formatted JSON arrays containing exactly 3 recipes."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        if not isinstance(response, OpenAIObject):
            raise ValueError("Unexpected response type from OpenAI")

        content = response.choices[0].message.content
        recipes = json.loads(content)
        return {"recipes": recipes, "has_extra_ingredients": data.allow_extra_ingredients}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail="Failed to parse recipe data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recipes")
async def create_recipes(request: Request, data: RecipeRequest):
    client_ip = request.client.host
    if not check_rate_limit(client_ip):
        retry_after = int((rate_limits[client_ip]['hourly']['reset'] - datetime.now()).total_seconds())
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": "Too many requests",
                "retry_after": retry_after
            }
        )

    try:
        # First try with exact ingredients
        result = generate_recipes(data)
        return result
    except Exception as e:
        if "ingredients" in str(e).lower() and not data.allow_extra_ingredients:
            # Try again allowing extra ingredients
            data.allow_extra_ingredients = True
            return generate_recipes(data)
        raise

@app.get("/rate-limit")
async def get_rate_limit(request: Request):
    client_ip = request.client.host
    if client_ip not in rate_limits:
        return {
            "daily": {"remaining": 50, "reset_in": 86400},
            "hourly": {"remaining": 5, "reset_in": 3600}
        }
    
    now = datetime.now()
    daily = rate_limits[client_ip]['daily']
    hourly = rate_limits[client_ip]['hourly']
    
    return {
        "daily": {
            "remaining": max(0, 50 - daily['count']),
            "reset_in": int((daily['reset'] - now).total_seconds())
        },
        "hourly": {
            "remaining": max(0, 5 - hourly['count']),
            "reset_in": int((hourly['reset'] - now).total_seconds())
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 