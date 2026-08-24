import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { initialGroceryItems, sampleRecipes } from './src/sampleData';
import { GroceryItem, Recipe, ScreenName } from './src/types';

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(initialGroceryItems);
  const [selectedRecipeId, setSelectedRecipeId] = useState(sampleRecipes[0].id);

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0];

  const openRecipe = (id: string) => {
    setSelectedRecipeId(id);
    setScreen('recipe-detail');
  };

  const addRecipeIngredients = (recipe: Recipe) => {
    const additions = recipe.ingredients.map((ingredient) => ({
      id: makeId(),
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      completed: false,
      recipeId: recipe.id,
    }));
    setGroceryItems((current) => [...current, ...additions]);
    setScreen('grocery');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {screen === 'home' && (
        <HomeScreen
          recipes={recipes}
          groceryItems={groceryItems}
          onNewRecipe={() => setScreen('new-recipe')}
          onRecipes={() => setScreen('recipes')}
          onGrocery={() => setScreen('grocery')}
          onRecipe={openRecipe}
        />
      )}
      {screen === 'recipes' && (
        <RecipesScreen
          recipes={recipes}
          onBack={() => setScreen('home')}
          onRecipe={openRecipe}
          onToggleFavorite={(id) =>
            setRecipes((current) =>
              current.map((recipe) =>
                recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe,
              ),
            )
          }
        />
      )}
      {screen === 'recipe-detail' && selectedRecipe && (
        <RecipeDetailScreen
          recipe={selectedRecipe}
          onBack={() => setScreen('recipes')}
          onAddToGrocery={() => addRecipeIngredients(selectedRecipe)}
        />
      )}
      {screen === 'new-recipe' && (
        <NewRecipeScreen
          onBack={() => setScreen('home')}
          onSave={(recipe) => {
            setRecipes((current) => [recipe, ...current]);
            setSelectedRecipeId(recipe.id);
            setScreen('recipe-detail');
          }}
        />
      )}
      {screen === 'grocery' && (
        <GroceryScreen
          items={groceryItems}
          onBack={() => setScreen('home')}
          onChange={setGroceryItems}
        />
      )}
    </SafeAreaView>
  );
}

function PageHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backButton} />
    </View>
  );
}

function HomeScreen({
  recipes,
  groceryItems,
  onNewRecipe,
  onRecipes,
  onGrocery,
  onRecipe,
}: {
  recipes: Recipe[];
  groceryItems: GroceryItem[];
  onNewRecipe: () => void;
  onRecipes: () => void;
  onGrocery: () => void;
  onRecipe: (id: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>RECIPE ORGANIZER</Text>
      <Text style={styles.heroTitle}>Good Morning!</Text>
      <Text style={styles.muted}>What are we making today?</Text>

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryAction} onPress={onNewRecipe}>
          <Text style={styles.actionPlus}>＋</Text>
          <Text style={styles.primaryActionText}>New Recipe</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={onRecipes}>
          <Text style={styles.actionPlus}>⌕</Text>
          <Text style={styles.secondaryActionText}>All Recipes</Text>
        </Pressable>
      </View>

      <SectionTitle title="Grocery List" action="View all" onPress={onGrocery} />
      <Pressable style={styles.card} onPress={onGrocery}>
        {groceryItems.slice(0, 4).map((item) => (
          <View key={item.id} style={styles.listRow}>
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]} />
            <Text style={[styles.listText, item.completed && styles.completedText]}>{item.name}</Text>
          </View>
        ))}
        {groceryItems.length === 0 && <Text style={styles.muted}>Your grocery list is empty.</Text>}
      </Pressable>

      <SectionTitle title="On The Menu" action="All recipes" onPress={onRecipes} />
      <View style={styles.recipeGrid}>
        {recipes.slice(0, 2).map((recipe) => (
          <Pressable key={recipe.id} style={styles.recipeCard} onPress={() => onRecipe(recipe.id)}>
            <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>Recipe Image</Text></View>
            <Text style={styles.recipeName}>{recipe.name}</Text>
            <Text style={styles.muted}>{recipe.cookTime}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function SectionTitle({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onPress}><Text style={styles.textLink}>{action}</Text></Pressable>
    </View>
  );
}

function RecipesScreen({
  recipes,
  onBack,
  onRecipe,
  onToggleFavorite,
}: {
  recipes: Recipe[];
  onBack: () => void;
  onRecipe: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <View style={styles.flex}>
      <PageHeader title="Recipes" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pageCompact}>
        <View style={styles.searchBox}><Text style={styles.muted}>Search recipes...</Text><Text>☰</Text></View>
        {recipes.map((recipe) => (
          <Pressable key={recipe.id} style={styles.recipeListCard} onPress={() => onRecipe(recipe.id)}>
            <View style={styles.listImagePlaceholder}><Text style={styles.imagePlaceholderText}>Image</Text></View>
            <View style={styles.recipeListInfo}>
              <Text style={styles.recipeName}>{recipe.name}</Text>
              <Text style={styles.muted}>{recipe.cookTime}</Text>
            </View>
            <Pressable hitSlop={12} onPress={() => onToggleFavorite(recipe.id)}>
              <Text style={styles.heart}>{recipe.favorite ? '♥' : '♡'}</Text>
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function RecipeDetailScreen({ recipe, onBack, onAddToGrocery }: { recipe: Recipe; onBack: () => void; onAddToGrocery: () => void }) {
  return (
    <View style={styles.flex}>
      <PageHeader title="Recipe" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pageCompact}>
        <View style={styles.detailImage}><Text style={styles.imagePlaceholderText}>Recipe Image</Text></View>
        <Text style={styles.detailTitle}>{recipe.name}</Text>
        <Text style={styles.muted}>{recipe.cookTime}</Text>
        <Pressable style={styles.fullButton} onPress={onAddToGrocery}>
          <Text style={styles.fullButtonText}>Add Ingredients to Grocery List</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.card}>
          {recipe.ingredients.map((ingredient) => (
            <View key={ingredient.id} style={styles.ingredientRow}>
              <Text style={styles.listText}>{ingredient.name}</Text>
              <Text style={styles.muted}>{ingredient.quantity} {ingredient.unit}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.steps.map((step, index) => (
          <View key={step.id} style={styles.stepCard}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
            <Text style={styles.stepText}>{step.instruction}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function NewRecipeScreen({ onBack, onSave }: { onBack: () => void; onSave: (recipe: Recipe) => void }) {
  const [name, setName] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [ingredients, setIngredients] = useState([{ id: makeId(), name: '', quantity: '', unit: '' }]);
  const [steps, setSteps] = useState([{ id: makeId(), instruction: '' }]);

  const save = () => {
    if (!name.trim()) return;
    onSave({
      id: makeId(),
      name: name.trim(),
      cookTime: cookTime.trim() || 'Time not set',
      favorite: false,
      ingredients: ingredients.filter((item) => item.name.trim()),
      steps: steps.filter((item) => item.instruction.trim()),
    });
  };

  return (
    <View style={styles.flex}>
      <PageHeader title="New Recipe" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pageCompact} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.detailImage}><Text style={styles.imagePlaceholderText}>＋ Add an Image</Text></Pressable>
        <Text style={styles.inputLabel}>Recipe Name</Text>
        <TextInput style={styles.input} placeholder="Recipe name" value={name} onChangeText={setName} />
        <Text style={styles.inputLabel}>Time</Text>
        <TextInput style={styles.input} placeholder="e.g. 45 min" value={cookTime} onChangeText={setCookTime} />

        <Text style={styles.sectionTitle}>Ingredients</Text>
        {ingredients.map((ingredient, index) => (
          <View key={ingredient.id} style={styles.ingredientInputs}>
            <TextInput style={[styles.input, styles.quantityInput]} placeholder="Qty" value={ingredient.quantity} onChangeText={(value) => setIngredients((current) => current.map((item, i) => i === index ? { ...item, quantity: value } : item))} />
            <TextInput style={[styles.input, styles.unitInput]} placeholder="Unit" value={ingredient.unit} onChangeText={(value) => setIngredients((current) => current.map((item, i) => i === index ? { ...item, unit: value } : item))} />
            <TextInput style={[styles.input, styles.nameInput]} placeholder="Ingredient" value={ingredient.name} onChangeText={(value) => setIngredients((current) => current.map((item, i) => i === index ? { ...item, name: value } : item))} />
          </View>
        ))}
        <Pressable style={styles.outlineButton} onPress={() => setIngredients((current) => [...current, { id: makeId(), name: '', quantity: '', unit: '' }])}><Text>＋ Add Ingredient</Text></Pressable>

        <Text style={styles.sectionTitle}>Instructions</Text>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepInputRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
            <TextInput style={[styles.input, styles.stepInput]} placeholder="What happens in this step?" multiline value={step.instruction} onChangeText={(value) => setSteps((current) => current.map((item, i) => i === index ? { ...item, instruction: value } : item))} />
          </View>
        ))}
        <Pressable style={styles.outlineButton} onPress={() => setSteps((current) => [...current, { id: makeId(), instruction: '' }])}><Text>＋ Add Step</Text></Pressable>
        <Pressable style={styles.fullButton} onPress={save}><Text style={styles.fullButtonText}>Save Recipe</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function GroceryScreen({ items, onBack, onChange }: { items: GroceryItem[]; onBack: () => void; onChange: (items: GroceryItem[]) => void }) {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (!newItem.trim()) return;
    onChange([...items, { id: makeId(), name: newItem.trim(), completed: false }]);
    setNewItem('');
  };

  return (
    <View style={styles.flex}>
      <PageHeader title="Grocery List" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pageCompact} keyboardShouldPersistTaps="handled">
        <View style={styles.addItemRow}>
          <TextInput style={[styles.input, styles.addItemInput]} placeholder="Add an item" value={newItem} onChangeText={setNewItem} onSubmitEditing={addItem} />
          <Pressable style={styles.smallButton} onPress={addItem}><Text style={styles.fullButtonText}>Add</Text></Pressable>
        </View>
        <View style={styles.card}>
          {items.map((item) => (
            <Pressable key={item.id} style={styles.groceryRow} onPress={() => onChange(items.map((current) => current.id === item.id ? { ...current, completed: !current.completed } : current))}>
              <View style={[styles.checkbox, item.completed && styles.checkboxChecked]} />
              <View style={styles.recipeListInfo}>
                <Text style={[styles.listText, item.completed && styles.completedText]}>{item.name}</Text>
                {(item.quantity || item.unit) && <Text style={styles.muted}>{item.quantity} {item.unit}</Text>}
              </View>
              <Pressable hitSlop={12} onPress={() => onChange(items.filter((current) => current.id !== item.id))}><Text style={styles.deleteText}>×</Text></Pressable>
            </Pressable>
          ))}
          {items.length === 0 && <Text style={styles.muted}>Add something you need from the store.</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f6f3' },
  flex: { flex: 1 },
  page: { paddingHorizontal: 22, paddingTop: 42, paddingBottom: 48 },
  pageCompact: { paddingHorizontal: 22, paddingBottom: 48 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2, color: '#666', marginBottom: 8 },
  heroTitle: { fontSize: 34, fontWeight: '800', color: '#191919' },
  muted: { color: '#737373', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 30 },
  primaryAction: { flex: 1, minHeight: 118, backgroundColor: '#222', borderRadius: 18, padding: 18, justifyContent: 'space-between' },
  secondaryAction: { flex: 1, minHeight: 118, backgroundColor: '#e5e5e1', borderRadius: 18, padding: 18, justifyContent: 'space-between' },
  actionPlus: { fontSize: 26 },
  primaryActionText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  secondaryActionText: { color: '#222', fontWeight: '700', fontSize: 17 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: '#202020', marginTop: 22, marginBottom: 12 },
  textLink: { fontSize: 13, color: '#555', textDecorationLine: 'underline' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 20 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  listText: { fontSize: 16, color: '#222' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#777', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#777' },
  completedText: { textDecorationLine: 'line-through', color: '#999' },
  recipeGrid: { flexDirection: 'row', gap: 12 },
  recipeCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 10 },
  imagePlaceholder: { height: 105, backgroundColor: '#deded9', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  imagePlaceholderText: { color: '#777', fontSize: 12 },
  recipeName: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 4 },
  header: { height: 70, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 38, lineHeight: 40, color: '#222' },
  headerTitle: { fontSize: 19, fontWeight: '800' },
  searchBox: { height: 52, borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  recipeListCard: { backgroundColor: '#fff', borderRadius: 18, padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  listImagePlaceholder: { width: 76, height: 76, borderRadius: 12, backgroundColor: '#deded9', alignItems: 'center', justifyContent: 'center' },
  recipeListInfo: { flex: 1, paddingHorizontal: 14 },
  heart: { fontSize: 28, paddingHorizontal: 8 },
  detailImage: { height: 220, backgroundColor: '#deded9', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  detailTitle: { fontSize: 30, fontWeight: '800', marginBottom: 4, color: '#202020' },
  fullButton: { minHeight: 54, borderRadius: 15, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingHorizontal: 16 },
  fullButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd' },
  stepCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10, alignItems: 'flex-start' },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#deded9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepNumberText: { fontWeight: '800' },
  stepText: { flex: 1, lineHeight: 21, color: '#333' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 7 },
  input: { minHeight: 50, borderRadius: 13, backgroundColor: '#fff', paddingHorizontal: 14, fontSize: 15, marginBottom: 12 },
  ingredientInputs: { flexDirection: 'row', gap: 7 },
  quantityInput: { width: 65 },
  unitInput: { width: 80 },
  nameInput: { flex: 1 },
  outlineButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: '#aaa', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepInputRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepInput: { flex: 1, minHeight: 90, paddingTop: 14, textAlignVertical: 'top' },
  addItemRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  addItemInput: { flex: 1, marginBottom: 0 },
  smallButton: { width: 72, borderRadius: 13, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  groceryRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd' },
  deleteText: { fontSize: 28, color: '#777', paddingHorizontal: 6 },
});
