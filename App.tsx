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

  const addRecipeToMenu = (recipe: Recipe) => {
    setMenuRecipeIds((current) => (current.includes(recipe.id) ? current : [...current, recipe.id]));

    const existingNames = new Set(groceryItems.map((item) => item.name.trim().toLowerCase()));
    const additions = recipe.ingredients
      .filter((ingredient) => !existingNames.has(ingredient.name.trim().toLowerCase()))
      .map((ingredient) => ({
        id: makeId(),
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        completed: false,
        recipeId: recipe.id,
      }));

    if (additions.length > 0) {
      setGroceryItems((current) => [...current, ...additions]);
    }

    setScreen('home');
  };

  const removeFromMenu = (id: string) => {
    setMenuRecipeIds((current) => current.filter((recipeId) => recipeId !== id));
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
          onRemoveFromMenu={removeFromMenu}
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
          onAddToMenu={() => addRecipeToMenu(selectedRecipe)}
          onEdit={() => setScreen('recipe-edit')}
          isOnMenu={menuRecipeIds.includes(selectedRecipe.id)}
        />
      )}

      {screen === 'new-recipe' && (
        <RecipeEditorScreen
          mode="new"
          onBack={() => setScreen('home')}
          onSave={(recipe) => {
            setRecipes((current) => [recipe, ...current]);
            setSelectedRecipeId(recipe.id);
            setScreen('recipe-detail');
          }}
        />
      )}

      {screen === 'recipe-edit' && selectedRecipe && (
        <RecipeEditorScreen
          mode="edit"
          recipe={selectedRecipe}
          onBack={() => setScreen('recipe-detail')}
          onSave={(recipe) => {
            setRecipes((current) => current.map((item) => (item.id === recipe.id ? recipe : item)));
            setSelectedRecipeId(recipe.id);
            setScreen('recipe-detail');
          }}
          onDelete={() => deleteRecipe(selectedRecipe.id)}
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

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.backButton} onPress={onPress} hitSlop={12}>
      <Text style={styles.backText}>‹</Text>
    </Pressable>
  );
}

function HomeScreen({
  groceryItems,
  menuRecipes,
  onNewRecipe,
  onRecipes,
  onGrocery,
  onRecipe,
  onRemoveFromMenu,
}: {
  groceryItems: GroceryItem[];
  menuRecipes: Recipe[];
  onNewRecipe: () => void;
  onRecipes: () => void;
  onGrocery: () => void;
  onRecipe: (id: string) => void;
  onRemoveFromMenu: (id: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.homePage}>
      <View style={styles.greetingCard}>
        <View>
          <Text style={styles.greetingTitle}>Good Morning!</Text>
          <Text style={styles.greetingSubtitle}>What are we cooking up today?</Text>
        </View>
        <View style={styles.profileCircle}>
          <Text style={styles.profileIcon}>♙</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionCard} onPress={onNewRecipe}>
          <Text style={styles.actionIcon}>＋</Text>
          <Text style={styles.actionText}>New Recipe</Text>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={onRecipes}>
          <Text style={styles.actionIcon}>⌕</Text>
          <Text style={styles.actionText}>All Recipes</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Grocery List</Text>
      <Pressable style={styles.homePanel} onPress={onGrocery}>
        {groceryItems.slice(0, 6).map((item) => (
          <View key={item.id} style={styles.homeGroceryRow}>
            <Text style={styles.miniCheck}>{item.completed ? '☑' : '☐'}</Text>
            <Text style={[styles.smallListText, item.completed && styles.completedText]}>{item.name}</Text>
          </View>
        ))}
        {groceryItems.length > 6 && <Text style={styles.moreText}>More...</Text>}
        {groceryItems.length === 0 && <Text style={styles.muted}>Your grocery list is empty.</Text>}
      </Pressable>

      <Text style={styles.sectionTitle}>On The Menu</Text>
      <View style={styles.menuList}>
        {menuRecipes.map((recipe) => (
          <Pressable key={recipe.id} style={styles.menuRow} onPress={() => onRecipe(recipe.id)}>
            <Pressable style={styles.removeMenuButton} hitSlop={10} onPress={() => onRemoveFromMenu(recipe.id)}>
              <Text style={styles.removeMenuText}>×</Text>
            </Pressable>
            <Text style={styles.menuText}>{recipe.name} | {recipe.cookTime}</Text>
          </Pressable>
        ))}
        {menuRecipes.length === 0 && (
          <View style={styles.emptyMenuCard}>
            <Text style={styles.muted}>Add a recipe to start planning your menu.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function RecipesScreen({
  recipes,
  onBack,
  onRecipe,
  onNewRecipe,
  onToggleFavorite,
}: {
  recipes: Recipe[];
  onBack: () => void;
  onRecipe: (id: string) => void;
  onNewRecipe: () => void;
  onToggleFavorite: (id: string) => void;
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
  }, [favoritesOnly, query, recipes]);

  return (
    <View style={styles.flex}>
      <View style={styles.simpleHeader}>
        <BackButton onPress={onBack} />
      </View>
      <ScrollView contentContainerStyle={styles.pageCompact} keyboardShouldPersistTaps="handled">
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search recipes"
            placeholderTextColor="#9b9b9b"
          />
          <Pressable
            style={[styles.filterButton, favoritesOnly && styles.filterButtonActive]}
            onPress={() => setFavoritesOnly((current) => !current)}
          >
            <Text style={[styles.filterText, favoritesOnly && styles.filterTextActive]}>▽</Text>
          </Pressable>
        </View>

        {filteredRecipes.map((recipe) => (
          <Pressable key={recipe.id} style={styles.recipeListCard} onPress={() => onRecipe(recipe.id)}>
            <View style={styles.recipeThumb} />
            <View style={styles.recipeListInfo}>
              <Text style={styles.recipeName}>{recipe.name}</Text>
              <Text style={styles.recipeTime}>{recipe.cookTime}</Text>
            </View>
            <Pressable hitSlop={12} onPress={() => onToggleFavorite(recipe.id)}>
              <Text style={styles.heart}>{recipe.favorite ? '♥' : '♡'}</Text>
            </Pressable>
          </Pressable>
        ))}

        {filteredRecipes.length === 0 && (
          <View style={styles.emptyMenuCard}>
            <Text style={styles.muted}>No recipes match that search.</Text>
          </View>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={onNewRecipe}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

function GroceryScreen({
  items,
  onBack,
  onChange,
}: {
  items: GroceryItem[];
  onBack: () => void;
  onChange: (items: GroceryItem[]) => void;
}) {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (!newItem.trim()) return;
    onChange([...items, { id: makeId(), name: newItem.trim(), completed: false }]);
    setNewItem('');
  };

  return (
    <View style={styles.flex}>
      <View style={styles.simpleHeader}>
        <BackButton onPress={onBack} />
      </View>
      <ScrollView contentContainerStyle={styles.pageCompact} keyboardShouldPersistTaps="handled">
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Add grocery item"
            placeholderTextColor="#9b9b9b"
            onSubmitEditing={addItem}
          />
          <Pressable style={styles.groceryAddButton} onPress={addItem}>
            <Text style={styles.groceryAddText}>＋</Text>
          </Pressable>
        </View>

        <View style={styles.groceryPanel}>
          {items.map((item) => (
            <View key={item.id} style={styles.groceryRow}>
              <Pressable
                style={styles.groceryCheckPress}
                onPress={() =>
                  onChange(items.map((current) =>
                    current.id === item.id ? { ...current, completed: !current.completed } : current,
                  ))
                }
              >
                <Text style={styles.groceryCheck}>{item.completed ? '☑' : '☐'}</Text>
                <Text style={[styles.groceryItemText, item.completed && styles.completedText]}>
                  {item.name}
                  {(item.quantity || item.unit) ? ` | ${item.quantity ?? ''}${item.unit ? ` ${item.unit}` : ''}` : ''}
                </Text>
              </Pressable>
              <Pressable hitSlop={10} onPress={() => onChange(items.filter((current) => current.id !== item.id))}>
                <Text style={styles.deleteText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function RecipeDetailScreen({
  recipe,
  onBack,
  onAddToMenu,
  onEdit,
  isOnMenu,
}: {
  recipe: Recipe;
  onBack: () => void;
  onAddToMenu: () => void;
  onEdit: () => void;
  isOnMenu: boolean;
}) {
  return (
    <View style={styles.flex}>
      <View style={styles.simpleHeader}>
        <BackButton onPress={onBack} />
      </View>
      <ScrollView contentContainerStyle={styles.pageCompact}>
        <View style={styles.detailImage}>
          <Text style={styles.imageIcon}>▧</Text>
        </View>

        <Text style={styles.detailTitle}>{recipe.name}</Text>
        <Text style={styles.recipeTime}>{recipe.cookTime}</Text>

        <Pressable style={styles.darkButton} onPress={onAddToMenu}>
          <Text style={styles.darkButtonText}>{isOnMenu ? 'Add Ingredients To Grocery List' : 'Add To The Menu'}</Text>
        </Pressable>

        <Text style={styles.detailSectionLabel}>Ingredients</Text>
        <View style={styles.ingredientList}>
          {recipe.ingredients.map((ingredient) => (
            <View key={ingredient.id} style={styles.ingredientPill}>
              <Text style={styles.ingredientText}>
                {ingredient.name} | {ingredient.quantity}{ingredient.unit ? ` ${ingredient.unit}` : ''}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.detailSectionLabel}>Instructions</Text>
        <View style={styles.stepsList}>
          {recipe.steps.map((step, index) => (
            <View key={step.id} style={styles.readStepCard}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.readStepText}>{step.instruction}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
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
    recipe?.ingredients.map((item) => ({ ...item })) ?? [
      { id: makeId(), name: '', quantity: '', unit: '' },
    ],
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
      ingredients: ingredients.filter((item) => item.name.trim()),
      steps: steps.filter((item) => item.instruction.trim()),
    });
  };

  const updateIngredient = (index: number, changes: Partial<Ingredient>) => {
    setIngredients((current) =>
      current.map((ingredient, i) => (i === index ? { ...ingredient, ...changes } : ingredient)),
    );
  };

  return (
    <View style={styles.flex}>
      <View style={styles.simpleHeader}>
        <BackButton onPress={onBack} />
      </View>
      <ScrollView contentContainerStyle={styles.editorPage} keyboardShouldPersistTaps="handled">
        <View style={styles.editorTopRow}>
          <Pressable style={styles.coverImageBox}>
            <Text style={styles.coverPlus}>＋</Text>
            <Text style={styles.coverLabel}>add cover image</Text>
          </Pressable>

          <View style={styles.editorMeta}>
            <TextInput
              style={styles.metaInput}
              value={name}
              onChangeText={setName}
              placeholder="Add Recipe Name"
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.timeInput}
              value={cookTime}
              onChangeText={setCookTime}
              placeholder="45 min⌄"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        <Pressable
          style={styles.addSectionButton}
          onPress={() =>
            setIngredients((current) => [...current, { id: makeId(), name: '', quantity: '', unit: '' }])
          }
        >
          <Text style={styles.addCircle}>⊕</Text>
          <Text style={styles.addSectionText}>Add An Ingredient</Text>
        </Pressable>

        {ingredients.map((ingredient, index) => (
          <View key={ingredient.id} style={styles.editorIngredientRow}>
            <TextInput
              style={[styles.inlineIngredientInput, styles.ingredientNameInput]}
              value={ingredient.name}
              onChangeText={(value) => updateIngredient(index, { name: value })}
              placeholder="Ingredient"
            />
            <Text style={styles.inlineDivider}>|</Text>
            <TextInput
              style={styles.quantityInlineInput}
              value={ingredient.quantity}
              onChangeText={(value) => updateIngredient(index, { quantity: value })}
              placeholder="Qty"
            />
            <TextInput
              style={styles.unitInlineInput}
              value={ingredient.unit}
              onChangeText={(value) => updateIngredient(index, { unit: value })}
              placeholder="Unit"
            />
            <Pressable
              hitSlop={10}
              onPress={() => setIngredients((current) => current.filter((_, i) => i !== index))}
            >
              <Text style={styles.inlineDelete}>×</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          style={styles.addSectionButton}
          onPress={() => setSteps((current) => [...current, { id: makeId(), instruction: '' }])}
        >
          <Text style={styles.addCircle}>⊕</Text>
          <Text style={styles.addSectionText}>Add A Step</Text>
        </Pressable>

        {steps.map((step, index) => (
          <View key={step.id} style={styles.editorStepCard}>
            <Text style={styles.editorStepLabel}>Step {index + 1}</Text>
            <TextInput
              style={styles.editorStepInput}
              multiline
              value={step.instruction}
              onChangeText={(value) =>
                setSteps((current) =>
                  current.map((item, i) => (i === index ? { ...item, instruction: value } : item)),
                )
              }
              placeholder="Describe what happens in this step..."
              textAlignVertical="top"
            />
            <View style={styles.stepControls}>
              <Pressable
                style={styles.stepControlButton}
                onPress={() => setSteps((current) => current.filter((_, i) => i !== index))}
              >
                <Text style={styles.stepControlText}>×</Text>
              </Pressable>
              {index > 0 && (
                <Pressable
                  style={styles.stepControlButton}
                  onPress={() =>
                    setSteps((current) => {
                      const copy = [...current];
                      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
                      return copy;
                    })
                  }
                >
                  <Text style={styles.stepControlText}>↑</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.stepAddMini}
                onPress={() => {
                  const newStep = { id: makeId(), instruction: '' };
                  setSteps((current) => {
                    const copy = [...current];
                    copy.splice(index + 1, 0, newStep);
                    return copy;
                  });
                }}
              >
                <Text style={styles.stepControlText}>＋</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View style={styles.editorFooter}>
          {mode === 'edit' && onDelete ? (
            <Pressable style={styles.deleteRecipeButton} onPress={onDelete}>
              <Text style={styles.footerButtonText}>Delete</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )}
          <Pressable style={styles.saveButton} onPress={save}>
            <Text style={styles.footerButtonText}>Save</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  flex: { flex: 1 },
  homePage: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 36 },
  pageCompact: { paddingHorizontal: 18, paddingBottom: 44 },
  editorPage: { paddingHorizontal: 18, paddingBottom: 28 },

  simpleHeader: { height: 54, justifyContent: 'center', paddingHorizontal: 14 },
  backButton: { width: 42, height: 42, justifyContent: 'center' },
  backText: { fontSize: 34, lineHeight: 34, color: '#242424', fontWeight: '300' },

  greetingCard: {
    minHeight: 92,
    borderRadius: 14,
    backgroundColor: '#dedede',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTitle: { fontSize: 23, fontWeight: '800', color: '#191919', marginBottom: 4 },
  greetingSubtitle: { fontSize: 12, color: '#222' },
  profileCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#c7c7c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: { fontSize: 24, color: '#333' },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 18 },
  actionCard: {
    flex: 1,
    minHeight: 102,
    backgroundColor: '#cfcfcf',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 34, color: '#202020', marginBottom: 7 },
  actionText: { fontSize: 12, fontWeight: '700', color: '#222' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#191919', marginTop: 10, marginBottom: 7 },
  homePanel: { backgroundColor: '#ededed', borderRadius: 13, padding: 14, minHeight: 125 },
  homeGroceryRow: { flexDirection: 'row', alignItems: 'center', minHeight: 20 },
  miniCheck: { fontSize: 15, width: 20, color: '#444' },
  smallListText: { fontSize: 12, color: '#222' },
  moreText: { marginTop: 7, fontSize: 12, fontWeight: '700', color: '#222' },
  completedText: { textDecorationLine: 'line-through', color: '#8f8f8f' },
  muted: { color: '#7a7a7a', fontSize: 13 },

  menuList: { gap: 7 },
  menuRow: {
    minHeight: 48,
    backgroundColor: '#e4e4e4',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  removeMenuButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#cecece',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  removeMenuText: { fontSize: 23, color: '#444', lineHeight: 24 },
  menuText: { flex: 1, fontSize: 12, color: '#222', fontWeight: '600' },
  emptyMenuCard: { padding: 18, backgroundColor: '#ededed', borderRadius: 12 },

  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1,
    minHeight: 46,
    borderRadius: 11,
    backgroundColor: '#eeeeee',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#222',
  },
  filterButton: {
    width: 62,
    minHeight: 46,
    borderRadius: 11,
    backgroundColor: '#858585',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: '#333' },
  filterText: { fontSize: 24, color: '#202020' },
  filterTextActive: { color: '#fff' },

  recipeListCard: {
    minHeight: 84,
    backgroundColor: '#e1e1e1',
    borderRadius: 12,
    marginBottom: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeThumb: { width: 56, height: 56, backgroundColor: '#9e9e9e', borderRadius: 7, marginRight: 12 },
  recipeListInfo: { flex: 1 },
  recipeName: { fontSize: 15, fontWeight: '800', color: '#171717' },
  recipeTime: { fontSize: 13, fontWeight: '600', color: '#222', marginTop: 2 },
  heart: { fontSize: 30, color: '#222', paddingHorizontal: 3 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 18,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#4b4b4b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 36, lineHeight: 38, fontWeight: '300' },

  groceryAddButton: {
    width: 62,
    minHeight: 46,
    backgroundColor: '#858585',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groceryAddText: { color: '#fff', fontSize: 28 },
  groceryPanel: { backgroundColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  groceryRow: {
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#aaa',
    flexDirection: 'row',
    alignItems: 'center',
  },
  groceryCheckPress: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  groceryCheck: { fontSize: 22, width: 28, color: '#3d3d3d' },
  groceryItemText: { fontSize: 13, color: '#222' },
  deleteText: { fontSize: 24, color: '#666', paddingHorizontal: 4 },

  detailImage: {
    width: '100%',
    height: 165,
    backgroundColor: '#d7d7d7',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIcon: { fontSize: 38, color: '#333' },
  detailTitle: { marginTop: 8, fontSize: 18, fontWeight: '800', color: '#171717' },
  darkButton: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 7,
    backgroundColor: '#323232',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  detailSectionLabel: { marginTop: 20, marginBottom: 8, fontSize: 13, fontWeight: '800', color: '#222' },
  ingredientList: { gap: 5 },
  ingredientPill: { minHeight: 32, backgroundColor: '#dddddd', borderRadius: 8, justifyContent: 'center', paddingHorizontal: 11 },
  ingredientText: { fontSize: 12, color: '#222', fontWeight: '600' },
  stepsList: { gap: 8 },
  readStepCard: {
    minHeight: 82,
    backgroundColor: '#dddddd',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#c3c3c3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  stepNumberText: { fontSize: 12, fontWeight: '700', color: '#333' },
  readStepText: { flex: 1, fontSize: 12, lineHeight: 16, color: '#222' },
  editButton: {
    minHeight: 42,
    marginTop: 12,
    backgroundColor: '#9e9e9e',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: { fontSize: 13, fontWeight: '700', color: '#222' },

  editorTopRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  coverImageBox: {
    width: 94,
    height: 94,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#555',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlus: { fontSize: 34, color: '#222', lineHeight: 36 },
  coverLabel: { fontSize: 8, color: '#333', marginTop: 4 },
  editorMeta: { flex: 1, gap: 8 },
  metaInput: { minHeight: 36, borderRadius: 8, backgroundColor: '#dedede', paddingHorizontal: 10, fontSize: 12, color: '#222' },
  timeInput: { width: 92, minHeight: 34, borderRadius: 8, backgroundColor: '#dedede', paddingHorizontal: 10, fontSize: 12, color: '#222' },
  addSectionButton: { flexDirection: 'row', alignItems: 'center', marginTop: 9, marginBottom: 7 },
  addCircle: { fontSize: 25, color: '#333', marginRight: 7 },
  addSectionText: { fontSize: 12, fontWeight: '700', color: '#222' },
  editorIngredientRow: {
    minHeight: 34,
    backgroundColor: '#dddddd',
    borderRadius: 7,
    marginBottom: 5,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineIngredientInput: { fontSize: 12, color: '#222', paddingVertical: 5 },
  ingredientNameInput: { flex: 1 },
  inlineDivider: { color: '#555', marginHorizontal: 4 },
  quantityInlineInput: { width: 42, fontSize: 12, color: '#222', paddingVertical: 5 },
  unitInlineInput: { width: 52, fontSize: 12, color: '#222', paddingVertical: 5 },
  inlineDelete: { fontSize: 20, color: '#666', paddingLeft: 4 },
  editorStepCard: { backgroundColor: '#dddddd', borderRadius: 8, padding: 10, marginBottom: 8 },
  editorStepLabel: { fontSize: 11, fontWeight: '800', color: '#222', marginBottom: 4 },
  editorStepInput: { minHeight: 52, fontSize: 11, lineHeight: 15, color: '#222', padding: 0 },
  stepControls: { flexDirection: 'row', gap: 5, marginTop: 7 },
  stepControlButton: { width: 34, height: 31, backgroundColor: '#b8b8b8', alignItems: 'center', justifyContent: 'center' },
  stepAddMini: { width: 34, height: 31, borderWidth: 1, borderStyle: 'dashed', borderColor: '#666', alignItems: 'center', justifyContent: 'center' },
  stepControlText: { fontSize: 20, color: '#555' },
  editorFooter: { marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  footerSpacer: { flex: 1 },
  deleteRecipeButton: { flex: 1, minHeight: 42, backgroundColor: '#8f8f8f', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveButton: { minWidth: 96, minHeight: 42, paddingHorizontal: 22, backgroundColor: '#9e9e9e', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  footerButtonText: { fontSize: 13, fontWeight: '700', color: '#171717' },
});
