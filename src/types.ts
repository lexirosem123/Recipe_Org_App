export type Ingredient = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

export type RecipeStep = {
  id: string;
  instruction: string;
  photoUri?: string;
};

export type Recipe = {
  id: string;
  name: string;
  cookTime: string;
  favorite: boolean;
  onMenu?: boolean;
  coverPhotoUri?: string;
  emoji?: string;
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
