from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import openai
from dotenv import load_dotenv
import os
import json
from datetime import datetime, timedelta
import hashlib

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

# Simple cache for common ingredient combinations
recipe_cache: Dict[str, Dict[str, Any]] = {}

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

def create_cache_key(data: RecipeRequest) -> str:
    """Create a cache key for the request"""
    ingredients_str = ",".join(sorted([ing.name.lower() for ing in data.ingredients]))
    return hashlib.md5(f"{ingredients_str}_{data.fitness_goal}_{data.meal_type}_{data.allow_extra_ingredients}".encode()).hexdigest()

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
    
    # Check limits - Much more generous for production
    if (rate_limits[ip]['daily']['count'] >= 10000 or 
        rate_limits[ip]['hourly']['count'] >= 1000):
        return False
    
    # Increment counters
    rate_limits[ip]['daily']['count'] += 1
    rate_limits[ip]['hourly']['count'] += 1
    return True

def generate_recipes(data: RecipeRequest) -> Dict[str, Any]:
    try:
        # Check cache first
        cache_key = create_cache_key(data)
        if cache_key in recipe_cache and not data.is_more:
            print(f"Cache hit for key: {cache_key}")
            return recipe_cache[cache_key]

        # Format ingredients for prompt
        ingredients_text = ", ".join([ing.name for ing in data.ingredients])

        # Simplified prompt for faster response
        prompt = f"""Create 3 healthy recipes for {data.fitness_goal or 'general fitness'} {data.meal_type or 'meal'} using: {ingredients_text}.

Each recipe should include:
- Name, description, ingredients, instructions
- Nutrition: calories, protein, carbs, fats
- Cooking time, prep time
- How it supports the fitness goal

IMPORTANT: Use simple, descriptive recipe names without adjectives like "hearty", "energetic", "protein-packed", "delicious", etc. Just use the main ingredients and cooking method.

Return as JSON array with structure:
{{
    "name": "Recipe Name",
    "description": "Brief description",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "instructions": ["step 1", "step 2"],
    "nutrition": {{"calories": number, "protein": number, "carbs": number, "fats": number}},
    "goal_alignment": "fitness goal explanation",
    "cooking_time": number,
    "prep_time": number
}}"""

        # Use GPT-3.5-turbo for faster response
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # Faster than GPT-4
            messages=[
                {"role": "system", "content": "You are a chef. You must return ONLY valid JSON with exactly 3 recipes. Do not include any text before or after the JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500  # Limit response size for speed
        )

        content = response.choices[0].message.content.strip()
        
        # Try to extract JSON if there's extra text
        try:
            # First try direct parsing
            recipes = json.loads(content)
        except json.JSONDecodeError:
            # Try to find JSON in the response
            import re
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                try:
                    recipes = json.loads(json_match.group())
                except json.JSONDecodeError:
                    raise HTTPException(status_code=500, detail="Failed to parse recipe data from OpenAI response")
            else:
                raise HTTPException(status_code=500, detail="No valid JSON found in OpenAI response")
        
        result = {"recipes": recipes, "has_extra_ingredients": data.allow_extra_ingredients}
        
        # Cache the result (only for non-load-more requests)
        if not data.is_more:
            recipe_cache[cache_key] = result
            # Keep cache size manageable
            if len(recipe_cache) > 100:
                # Remove oldest entries
                oldest_keys = list(recipe_cache.keys())[:20]
                for key in oldest_keys:
                    del recipe_cache[key]
        
        return result

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail="Failed to parse recipe data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recipes")
async def create_recipes(request: Request, data: RecipeRequest):
    try:
        # First try with exact ingredients
        result = generate_recipes(data)
        return result
    except Exception as e:
        if "ingredients" in str(e).lower() and not data.allow_extra_ingredients:
            # Try again allowing extra ingredients
            data.allow_extra_ingredients = True
            try:
                result = generate_recipes(data)
                return result
            except Exception as e2:
                raise HTTPException(status_code=500, detail=str(e2))
        raise

@app.post("/recipes/more")
async def get_more_recipes(request: Request, data: RecipeRequest):
    try:
        # For load more, always allow extra ingredients and request different recipes
        data.allow_extra_ingredients = True
        data.is_more = True
        result = generate_recipes(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rate-limit")
async def get_rate_limit(request: Request):
    client_ip = getattr(request.client, 'host', 'unknown')
    if client_ip in rate_limits:
        return {
            "daily_remaining": max(0, 50 - rate_limits[client_ip]['daily']['count']),
            "hourly_remaining": max(0, 5 - rate_limits[client_ip]['hourly']['count']),
            "daily_reset": rate_limits[client_ip]['daily']['reset'].isoformat(),
            "hourly_reset": rate_limits[client_ip]['hourly']['reset'].isoformat()
        }
    return {
        "daily_remaining": 50,
        "hourly_remaining": 5,
        "daily_reset": (datetime.now() + timedelta(days=1)).isoformat(),
        "hourly_reset": (datetime.now() + timedelta(hours=1)).isoformat()
    }

@app.get("/")
async def root():
    return {"message": "Recipe Finder API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 