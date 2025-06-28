import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000',  // Our FastAPI backend URL
  timeout: 30000,  // 30 seconds timeout for recipe generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const endpoints = {
  recipes: '/recipes',
  rateLimit: '/rate-limit',
};

export default api; 