export type Ingredient = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

export type RecipeStep = {
  id: string;
  instruction: string;
};

export type Recipe = {
  id: string;
  name: string;
  cookTime: string;
  favorite: boolean;
  ingredients: Ingredient[];
  steps: RecipeStep[];
};

export type GroceryItem = {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  completed: boolean;
  recipeId?: string;
};

export type ScreenName =
  | 'home'
  | 'recipes'
  | 'recipe-detail'
  | 'recipe-edit'
  | 'new-recipe'
  | 'grocery';
