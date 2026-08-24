import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
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
import { GroceryItem, Ingredient, Recipe, RecipeStep, ScreenName } from './src/types';

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(initialGroceryItems);
  const [selectedRecipeId, setSelectedRecipeId] = useState(sampleRecipes[0].id);
  const [menuRecipeIds, setMenuRecipeIds] = useState<string[]>([sampleRecipes[0].id]);

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0];
  const menuRecipes = menuRecipeIds
    .map((id) => recipes.find((recipe) => recipe.id === id))
    .filter((recipe): recipe is Recipe => Boolean(recipe));

  const openRecipe = (id: string) => {
    setSelectedRecipeId(id);
    setScreen('recipe-detail');
  };

  const addToMenu = (recipe: Recipe) => {
    if (!menuRecipeIds.includes(recipe.id)) {
      setMenuRecipeIds((current) => [...current, recipe.id]);
    }

    setGroceryItems((current) => {
      const existing = new Set(current.map((item) => item.name.toLowerCase()));
      const additions = recipe.ingredients
        .filter((ingredient) => !existing.has(ingredient.name.toLowerCase()))
        .map((ingredient) => ({
          id: makeId(),
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          completed: false,
          recipeId: recipe.id,
        }));
      return [...current, ...additions];
    });

    setScreen('home');
  };

  const removeFromMenu = (id: string) => {
    setMenuRecipeIds((current) => current.filter((recipeId) => recipeId !== id));
  };

  const saveRecipe = (recipe: Recipe) => {
    setRecipes((current) => {
      const exists = current.some((item) => item.id === recipe.id);
      return exists
        ? current.map((item) => (item.id === recipe.id ? recipe : item))
        : [recipe, ...current];
    });
    setSelectedRecipeId(recipe.id);
    setScreen('recipe-detail');
  };

  const deleteRecipe = (id: string) => {
    setRecipes((current) => current.filter((recipe) => recipe.id !== id));
    setMenuRecipeIds((current) => current.filter((recipeId) => recipeId !== id));
    setScreen('recipes');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {screen === 'home' && (
        <HomeScreen
          groceryItems={groceryItems}
          menuRecipes={menuRecipes}
          onNewRecipe={() => setScreen('new-recipe')}
          onRecipes={() => setScreen('recipes')}
          onGrocery={() => setScreen('grocery')}
          onRecipe={openRecipe}
          onRemoveMenu={removeFromMenu}
        />
      )}

      {screen === 'recipes' && (
        <RecipesScreen
          recipes={recipes}
          onBack={() => setScreen('home')}
          onRecipe={openRecipe}
          onNewRecipe={() => setScreen('new-recipe')}
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
          onEdit={() => setScreen('recipe-edit')}
          onAddToMenu={() => addToMenu(selectedRecipe)}
        />
      )}

      {screen === 'recipe-edit' && selectedRecipe && (
        <RecipeEditorScreen
          mode="edit"
          recipe={selectedRecipe}
          onBack={() => setScreen('recipe-detail')}
          onSave={saveRecipe}
          onDelete={() => deleteRecipe(selectedRecipe.id)}
        />
      )}

      {screen === 'new-recipe' && (
        <RecipeEditorScreen
          mode="new"
          onBack={() => setScreen('home')}
          onSave={saveRecipe}
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
  groceryItems,
  menuRecipes,
  onNewRecipe,
  onRecipes,
  onGrocery,
  onRecipe,
  onRemoveMenu,
}: {
  groceryItems: GroceryItem[];
  menuRecipes: Recipe[];
  onNewRecipe: () => void;
  onRecipes: () => void;
  onGrocery: () => void;
  onRecipe: (id: string) => void;
  onRemoveMenu: (id: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.greetingCard}>
        <View>
          <Text style={styles.heroTitle}>Good Morning!</Text>
          <Text style={styles.muted}>What are we cooking up today?</Text>
        </View>
        <View style={styles.profileCircle}><Text style={styles.profileIcon}>◯</Text></View>
      </View>

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

      <SectionTitle title="Grocery List" action="Edit List →" onPress={onGrocery} />
      <Pressable style={styles.card} onPress={onGrocery}>
        {groceryItems.slice(0, 6).map((item) => (
          <View key={item.id} style={styles.listRow}>
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.listText, item.completed && styles.completedText]}>{item.name}</Text>
          </View>
        ))}
        {groceryItems.length > 6 && <Text style={styles.textLink}>More...</Text>}
        {groceryItems.length === 0 && <Text style={styles.muted}>Your grocery list is empty.</Text>}
      </Pressable>

      <SectionTitle title="On The Menu" action="All recipes" onPress={onRecipes} />
      <View style={styles.card}>
        {menuRecipes.length === 0 && <Text style={styles.muted}>Add a recipe to your menu to see it here.</Text>}
        {menuRecipes.map((recipe) => (
          <View key={recipe.id} style={styles.menuRow}>
            <Pressable style={styles.menuRemove} onPress={() => onRemoveMenu(recipe.id)}>
              <Text style={styles.menuRemoveText}>×</Text>
            </Pressable>
            <Pressable style={styles.menuRecipeTap} onPress={() => onRecipe(recipe.id)}>
              <Text style={styles.listText}>{recipe.name}</Text>
              <Text style={styles.muted}> | {recipe.cookTime}</Text>
            </Pressable>
          </View>
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
  onNewRecipe,
}: {
  recipes: Recipe[];
  onBack: () => void;
  onRecipe: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNewRecipe: () => void;
}) {
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const filteredRecipes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const matchesSearch = !normalized || recipe.name.toLowerCase().includes(normalized);
      const matchesFavorite = !favoritesOnly || recipe.favorite;
      return matchesSearch && matchesFavorite;
    });
  }, [recipes, query, favoritesOnly]);

  return (
    <View style={styles.flex}>
      <PageHeader title="Recipes" onBack={onBack} />
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, styles.searchInput]}
          placeholder="Search recipes..."
          value={query}
          onChangeText={setQuery}
        />
        <Pressable
          style={[styles.filterButton, favoritesOnly && styles.filterButtonActive]}
          onPress={() => setFavoritesOnly((current) => !current)}
        >
          <Text style={favoritesOnly ? styles.filterTextActive : styles.filterText}>♥</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.pageCompact}>
        {filteredRecipes.map((recipe) => (
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
        {filteredRecipes.length === 0 && <Text style={styles.muted}>No recipes match your search.</Text>}
      </ScrollView>
      <Pressable style={styles.floatingButton} onPress={onNewRecipe}><Text style={styles.floatingButtonText}>＋</Text></Pressable>
    </View>
  );
}

function RecipeDetailScreen({
  recipe,
  onBack,
  onEdit,
  onAddToMenu,
}: {
  recipe: Recipe;
  onBack: () => void;
  onEdit: () => void;
  onAddToMenu: () => void;
}) {
  return (
    <View style={styles.flex}>
      <PageHeader title="Recipe" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pageCompact}>
        <View style={styles.detailImage}><Text style={styles.imagePlaceholderText}>Recipe Image</Text></View>
        <Text style={styles.detailTitle}>{recipe.name}</Text>
        <Text style={styles.muted}>{recipe.cookTime}</Text>

        <Pressable style={styles.fullButton} onPress={onAddToMenu}>
          <Text style={styles.fullButtonText}>Add To The Menu</Text>
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
            <View style={styles.stepContent}>
              <Text style={styles.stepText}>{step.instruction}</Text>
              {step.photoUri && <View style={styles.stepPhotoPreview}><Text style={styles.imagePlaceholderText}>Step Photo</Text></View>}
            </View>
          </View>
        ))}

        <Pressable style={styles.editButton} onPress={onEdit}><Text style={styles.editButtonText}>Edit</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function RecipeEditorScreen({
  mode,
  recipe,
  onBack,
  onSave,
  onDelete,
}: {
  mode: 'new' | 'edit';
  recipe?: Recipe;
  onBack: () => void;
  onSave: (recipe: Recipe) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(recipe?.name ?? '');
  const [cookTime, setCookTime] = useState(recipe?.cookTime ?? '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients.map((item) => ({ ...item })) ?? [{ id: makeId(), name: '', quantity: '', unit: '' }],
  );
  const [steps, setSteps] = useState<RecipeStep[]>(
    recipe?.steps.map((item) => ({ ...item })) ?? [{ id: makeId(), instruction: '' }],
  );

  const save = () => {
    if (!name.trim()) return;
    onSave({
      id: recipe?.id ?? makeId(),
      name: name.trim(),
      cookTime: cookTime.trim() || 'Time not set',
      favorite: recipe?.favorite ?? false,
      onMenu: recipe?.onMenu,
      ingredients: ingredients.filter((item) => item.name.trim()),
      steps: steps.filter((item) => item.instruction.trim()),
    });
  };

  const updateIngredient = (index: number, key: keyof Ingredient, value: string) => {
    setIngredients((current) => current.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const updateStep = (index: number, instruction: string) => {
    setSteps((current) => current.map((item, i) => (i === index ? { ...item, instruction } : item)));
  };

  return (
    <View style={styles.flex}>
      <PageHeader title={mode === 'new' ? 'New Recipe' : 'Edit Recipe'} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pageCompact} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.detailImage}><Text style={styles.imagePlaceholderText}>＋ Add an Image</Text></Pressable>

        <Text style={styles.inputLabel}>Recipe Name</Text>
        <TextInput style={styles.input} placeholder="Recipe name" value={name} onChangeText={setName} />
        <Text style={styles.inputLabel}>Time</Text>
        <TextInput style={styles.input} placeholder="e.g. 45 min" value={cookTime} onChangeText={setCookTime} />

        <Text style={styles.sectionTitle}>Ingredients</Text>
        {ingredients.map((ingredient, index) => (
          <View key={ingredient.id} style={styles.ingredientInputs}>
            <TextInput style={[styles.input, styles.quantityInput]} placeholder="Qty" value={ingredient.quantity} onChangeText={(value) => updateIngredient(index, 'quantity', value)} />
            <TextInput style={[styles.input, styles.unitInput]} placeholder="Unit" value={ingredient.unit} onChangeText={(value) => updateIngredient(index, 'unit', value)} />
            <TextInput style={[styles.input, styles.nameInput]} placeholder="Ingredient" value={ingredient.name} onChangeText={(value) => updateIngredient(index, 'name', value)} />
          </View>
        ))}
        <Pressable style={styles.outlineButton} onPress={() => setIngredients((current) => [...current, { id: makeId(), name: '', quantity: '', unit: '' }])}>
          <Text>＋ Add Ingredient</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Instructions</Text>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepEditorCard}>
            <View style={styles.stepEditorTopRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
              <TextInput
                style={[styles.input, styles.stepInput]}
                placeholder="What happens in this step?"
                multiline
                value={step.instruction}
                onChangeText={(value) => updateStep(index, value)}
              />
            </View>
            <View style={styles.stepEditorActions}>
              <Pressable
                style={styles.stepPhotoButton}
                onPress={() =>
                  setSteps((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, photoUri: item.photoUri ? undefined : 'placeholder' } : item,
                    ),
                  )
                }
              >
                <Text style={styles.stepPhotoPlus}>＋</Text>
                <Text style={styles.stepPhotoLabel}>{step.photoUri ? 'Photo Added' : 'Add Step Photo'}</Text>
              </Pressable>
              <Pressable style={styles.stepRemoveButton} onPress={() => setSteps((current) => current.filter((_, i) => i !== index))}>
                <Text style={styles.deleteText}>×</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable style={styles.outlineButton} onPress={() => setSteps((current) => [...current, { id: makeId(), instruction: '' }])}>
          <Text>＋ Add Step</Text>
        </Pressable>

        <View style={styles.editorFooter}>
          {mode === 'edit' && onDelete && (
            <Pressable style={styles.deleteButton} onPress={onDelete}><Text style={styles.deleteButtonText}>Delete</Text></Pressable>
          )}
          <Pressable style={[styles.fullButton, styles.saveButton]} onPress={save}><Text style={styles.fullButtonText}>Save Recipe</Text></Pressable>
        </View>
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
            <View key={item.id} style={styles.groceryRow}>
              <Pressable onPress={() => onChange(items.map((current) => current.id === item.id ? { ...current, completed: !current.completed } : current))}>
                <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                  {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </Pressable>
              <View style={styles.recipeListInfo}>
                <Text style={[styles.listText, item.completed && styles.completedText]}>{item.name}</Text>
                {(item.quantity || item.unit) && <Text style={styles.muted}>{item.quantity} {item.unit}</Text>}
              </View>
              <Pressable hitSlop={12} onPress={() => onChange(items.filter((current) => current.id !== item.id))}><Text style={styles.deleteText}>×</Text></Pressable>
            </View>
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
  page: { paddingHorizontal: 22, paddingTop: 36, paddingBottom: 48 },
  pageCompact: { paddingHorizontal: 22, paddingBottom: 48 },

  header: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 38, fontWeight: '300', color: '#222', marginTop: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#222' },

  greetingCard: { backgroundColor: '#ececea', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#191919', marginBottom: 4 },
  muted: { color: '#737373', fontSize: 14 },
  profileCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#d4d4d1', alignItems: 'center', justifyContent: 'center' },
  profileIcon: { fontSize: 24, color: '#333' },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 18, marginBottom: 28 },
  primaryAction: { flex: 1, minHeight: 112, backgroundColor: '#222', borderRadius: 18, padding: 18, justifyContent: 'space-between' },
  secondaryAction: { flex: 1, minHeight: 112, backgroundColor: '#e5e5e2', borderRadius: 18, padding: 18, justifyContent: 'space-between' },
  actionPlus: { fontSize: 32, color: '#333' },
  primaryActionText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryActionText: { color: '#222', fontWeight: '700', fontSize: 16 },

  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#222', marginTop: 18, marginBottom: 10 },
  textLink: { fontSize: 13, fontWeight: '700', color: '#555' },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 8 },
  listRow: { flexDirection: 'row', alignItems: 'center', minHeight: 30, gap: 10 },
  listText: { color: '#222', fontSize: 15, fontWeight: '600' },
  checkbox: { width: 19, height: 19, borderWidth: 1.5, borderColor: '#666', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#333', borderColor: '#333' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  completedText: { textDecorationLine: 'line-through', color: '#999' },

  menuRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuRemove: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#e4e4e1', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  menuRemoveText: { fontSize: 22, color: '#555' },
  menuRecipeTap: { flex: 1, flexDirection: 'row', alignItems: 'center' },

  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginBottom: 12 },
  searchInput: { flex: 1, marginBottom: 0 },
  filterButton: { width: 52, height: 48, borderRadius: 14, backgroundColor: '#e5e5e2', alignItems: 'center', justifyContent: 'center' },
  filterButtonActive: { backgroundColor: '#222' },
  filterText: { fontSize: 20, color: '#333' },
  filterTextActive: { fontSize: 20, color: '#fff' },

  recipeListCard: { backgroundColor: '#fff', borderRadius: 18, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  listImagePlaceholder: { width: 74, height: 74, borderRadius: 14, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { color: '#666', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  recipeListInfo: { flex: 1 },
  recipeName: { color: '#222', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  heart: { fontSize: 28, color: '#222' },
  floatingButton: { position: 'absolute', right: 24, bottom: 28, width: 64, height: 64, borderRadius: 32, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  floatingButtonText: { color: '#fff', fontSize: 34, fontWeight: '300' },

  detailImage: { height: 220, borderRadius: 18, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  detailTitle: { fontSize: 28, fontWeight: '800', color: '#191919', marginBottom: 4 },
  fullButton: { minHeight: 50, borderRadius: 14, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 18, marginBottom: 8 },
  fullButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 38, borderBottomWidth: 1, borderBottomColor: '#eee' },

  stepCard: { backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 12, flexDirection: 'row', gap: 12 },
  stepNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontWeight: '800', color: '#333' },
  stepContent: { flex: 1 },
  stepText: { fontSize: 14, color: '#333', lineHeight: 20 },
  stepPhotoPreview: { height: 90, marginTop: 10, borderRadius: 12, backgroundColor: '#e7e7e4', alignItems: 'center', justifyContent: 'center' },
  editButton: { minHeight: 48, borderRadius: 14, backgroundColor: '#d8d8d5', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  editButtonText: { color: '#222', fontWeight: '800', fontSize: 15 },

  inputLabel: { fontWeight: '800', color: '#333', marginBottom: 6, marginTop: 4 },
  input: { minHeight: 48, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, color: '#222', marginBottom: 12 },
  ingredientInputs: { flexDirection: 'row', gap: 8 },
  quantityInput: { width: 70 },
  unitInput: { width: 82 },
  nameInput: { flex: 1 },
  outlineButton: { minHeight: 48, borderWidth: 1.5, borderColor: '#bbb', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },

  stepEditorCard: { backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 12 },
  stepEditorTopRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepInput: { flex: 1, minHeight: 100, textAlignVertical: 'top', marginBottom: 0 },
  stepEditorActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stepPhotoButton: { flex: 1, minHeight: 72, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#888', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepPhotoPlus: { fontSize: 26, color: '#444' },
  stepPhotoLabel: { fontSize: 12, fontWeight: '700', color: '#555' },
  stepRemoveButton: { width: 54, minHeight: 72, backgroundColor: '#eee', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 26, color: '#666' },

  editorFooter: { flexDirection: 'row', gap: 10, marginTop: 6 },
  deleteButton: { flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: '#d8d8d5', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  deleteButtonText: { color: '#222', fontWeight: '800' },
  saveButton: { flex: 1 },

  addItemRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  addItemInput: { flex: 1, marginBottom: 0 },
  smallButton: { minWidth: 70, minHeight: 48, borderRadius: 14, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  groceryRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
