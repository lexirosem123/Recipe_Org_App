import { GroceryItem, Recipe } from './types';

export const sampleRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Steak & Peppers',
    cookTime: '45 min',
    favorite: true,
    ingredients: [
      { id: 'i1', name: 'Milk', quantity: '1', unit: 'cup' },
      { id: 'i2', name: 'Peppers', quantity: '4', unit: '' },
      { id: 'i3', name: 'Onions', quantity: '2', unit: '' },
      { id: 'i4', name: 'Steak', quantity: '10', unit: 'oz' },
    ],
    steps: [
      { id: 's1', instruction: 'Preheat oven to 350°F and prepare the vegetables.' },
      { id: 's2', instruction: 'Season the steak and cook until it reaches your preferred doneness.' },
    ],
  },
  {
    id: '2',
    name: 'Garden Pasta',
    cookTime: '30 min',
    favorite: false,
    ingredients: [
      { id: 'i5', name: 'Pasta', quantity: '12', unit: 'oz' },
      { id: 'i6', name: 'Tomatoes', quantity: '2', unit: 'cups' },
    ],
    steps: [{ id: 's3', instruction: 'Cook pasta and toss with the prepared vegetables.' }],
  },
];

export const initialGroceryItems: GroceryItem[] = [
  { id: 'g1', name: 'Milk', completed: false },
  { id: 'g2', name: 'Eggs', completed: false },
  { id: 'g3', name: 'Tomatoes', completed: true },
];
