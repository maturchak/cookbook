export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Ingredient {
  id: string;
  name: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  cookingTime: number;
  servings: number;
  imageUrl: string;
  rating: number;
  authorId: string;
  authorName: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  isFavorited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface PlanItem {
  id: string;
  recipeId: string;
  recipeTitle: string;
  dayOfWeek: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  items: PlanItem[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}
