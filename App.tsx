import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
const emojiOptions = ['🍝', '🍕', '🥗', '🍲', '🥘', '🌮', '🍔', '🥪', '🍳', '🥞', '🍗', '🥩', '🍤', '🍣', '🍰', '🧁', '🍪', '🥖'];

async function pickPhoto(aspect: [number, number] = [4, 3]) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Photo access needed', 'Please allow photo access so you can choose recipe images.');
    return undefined;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.85,
  });

  return result.canceled ? undefined : result.assets[0]?.uri;
}

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
    if (!menuRecipeIds.includes(recipe.id)) setMenuRecipeIds((current) => [...current, recipe.id]);
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

  const saveRecipe = (recipe: Recipe) => {
    setRecipes((current) => {
      const exists = current.some((item) => item.id === recipe.id);
      return exists ? current.map((item) => (item.id === recipe.id ? recipe : item)) : [recipe, ...current];
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
          onRemoveMenu={(id) => setMenuRecipeIds((current) => current.filter((recipeId) => recipeId !== id))}
        />
      )}

      {screen === 'recipes' && (
        <RecipesScreen
          recipes={recipes}
          onBack={() => setScreen('home')}
          onRecipe={openRecipe}
          onNewRecipe={() => setScreen('new-recipe')}
          onToggleFavorite={(id) => setRecipes((current) => current.map((recipe) => recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe))}
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
        <RecipeEditorScreen mode="new" onBack={() => setScreen('home')} onSave={saveRecipe} />
      )}

      {screen === 'grocery' && (
        <GroceryScreen items={groceryItems} onBack={() => setScreen('home')} onChange={setGroceryItems} />
      )}
    </SafeAreaView>
  );
}

function PageHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      {onBack ? <Pressable style={styles.backButton} onPress={onBack}><Text style={styles.backText}>‹</Text></Pressable> : <View style={styles.backButton} />}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backButton} />
    </View>
  );
}

function RecipeVisual({ recipe, compact = false }: { recipe: Recipe; compact?: boolean }) {
  if (recipe.coverPhotoUri) {
    return <Image source={{ uri: recipe.coverPhotoUri }} style={compact ? styles.listImage : styles.coverImage} />;
  }
  if (recipe.emoji) {
    return <View style={compact ? styles.listEmojiBox : styles.emojiCover}><Text style={compact ? styles.listEmoji : styles.coverEmoji}>{recipe.emoji}</Text></View>;
  }
  return <View style={compact ? styles.listImagePlaceholder : styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>Recipe Image</Text></View>;
}

function HomeScreen({ groceryItems, menuRecipes, onNewRecipe, onRecipes, onGrocery, onRecipe, onRemoveMenu }: {
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
        <View><Text style={styles.heroTitle}>Good Morning!</Text><Text style={styles.muted}>What are we cooking up today?</Text></View>
        <View style={styles.profileCircle}><Text style={styles.profileIcon}>◯</Text></View>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryAction} onPress={onNewRecipe}><Text style={styles.actionPlusLight}>＋</Text><Text style={styles.primaryActionText}>New Recipe</Text></Pressable>
        <Pressable style={styles.secondaryAction} onPress={onRecipes}><Text style={styles.actionPlus}>⌕</Text><Text style={styles.secondaryActionText}>All Recipes</Text></Pressable>
      </View>

      <SectionTitle title="Grocery List" action="Edit List →" onPress={onGrocery} />
      <Pressable style={styles.card} onPress={onGrocery}>
        {groceryItems.slice(0, 6).map((item) => (
          <View key={item.id} style={styles.listRow}>
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>{item.completed && <Text style={styles.checkmark}>✓</Text>}</View>
            <Text style={[styles.listText, item.completed && styles.completedText]}>{item.name}</Text>
          </View>
        ))}
        {groceryItems.length > 6 && <Text style={styles.textLink}>More...</Text>}
      </Pressable>

      <SectionTitle title="On The Menu" action="All recipes →" onPress={onRecipes} />
      <View style={styles.menuGrid}>
        {menuRecipes.length === 0 && <View style={styles.card}><Text style={styles.muted}>Add a recipe to your menu to see it here.</Text></View>}
        {menuRecipes.map((recipe) => (
          <Pressable key={recipe.id} style={styles.menuRecipeCard} onPress={() => onRecipe(recipe.id)}>
            <Pressable hitSlop={10} style={styles.menuCardRemove} onPress={() => onRemoveMenu(recipe.id)}><Text style={styles.menuCardRemoveText}>×</Text></Pressable>
            <RecipeVisual recipe={recipe} />
            <Text style={styles.recipeName}>{recipe.name}</Text>
            <Text style={styles.muted}>{recipe.cookTime}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function SectionTitle({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={onPress}><Text style={styles.textLink}>{action}</Text></Pressable></View>;
}

function RecipesScreen({ recipes, onBack, onRecipe, onToggleFavorite, onNewRecipe }: {
  recipes: Recipe[];
  onBack: () => void;
  onRecipe: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNewRecipe: () => void;
}) {
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const filteredRecipes = useMemo(() => recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesSearch && (!favoritesOnly || recipe.favorite);
  }), [recipes, query, favoritesOnly]);

  return (
    <View style={styles.flex}>
      <PageHeader title="Recipes" onBack={onBack} />
      <View style={styles.searchRow}>
        <TextInput style={[styles.input, styles.searchInput]} placeholder="Search recipes..." value={query} onChangeText={setQuery} />
        <Pressable style={[styles.filterButton, favoritesOnly && styles.filterButtonActive]} onPress={() => setFavoritesOnly((current) => !current)}>
          <Text style={favoritesOnly ? styles.filterTextActive : styles.filterText}>♥</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.pageCompact}>
        {filteredRecipes.map((recipe) => (
          <Pressable key={recipe.id} style={styles.recipeListCard} onPress={() => onRecipe(recipe.id)}>
            <RecipeVisual recipe={recipe} compact />
            <View style={styles.recipeListInfo}><Text style={styles.recipeName}>{recipe.name}</Text><Text style={styles.muted}>{recipe.cookTime}</Text></View>
            <Pressable hitSlop={12} onPress={() => onToggleFavorite(recipe.id)}><Text style={styles.heart}>{recipe.favorite ? '♥' : '♡'}</Text></Pressable>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable style={styles.floatingButton} onPress={onNewRecipe}><Text style={styles.floatingButtonText}>＋</Text></Pressable>
    </View>
  );
}

function RecipeDetailScreen({ recipe, onBack, onEdit, onAddToMenu }: { recipe: Recipe; onBack: () => void; onEdit: () => void; onAddToMenu: () => void }) {
  return (
    <View style={styles.flex}>
      <PageHeader title="Recipe" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pageCompact}>
        <RecipeVisual recipe={recipe} />
        <Text style={styles.detailTitle}>{recipe.name}</Text>
        <Text style={styles.muted}>{recipe.cookTime}</Text>
        <Pressable style={styles.fullButton} onPress={onAddToMenu}><Text style={styles.fullButtonText}>Add To The Menu</Text></Pressable>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.card}>{recipe.ingredients.map((ingredient) => <View key={ingredient.id} style={styles.ingredientRow}><Text style={styles.listText}>{ingredient.name}</Text><Text style={styles.muted}>{ingredient.quantity} {ingredient.unit}</Text></View>)}</View>

        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.steps.map((step, index) => (
          <View key={step.id} style={styles.stepCard}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepText}>{step.instruction}</Text>
              {step.photoUri && <Image source={{ uri: step.photoUri }} style={styles.stepPhotoPreview} />}
            </View>
          </View>
        ))}
        <Pressable style={styles.editButton} onPress={onEdit}><Text style={styles.editButtonText}>Edit</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function RecipeEditorScreen({ mode, recipe, onBack, onSave, onDelete }: {
  mode: 'new' | 'edit';
  recipe?: Recipe;
  onBack: () => void;
  onSave: (recipe: Recipe) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(recipe?.name ?? '');
  const [cookTime, setCookTime] = useState(recipe?.cookTime ?? '');
  const [coverPhotoUri, setCoverPhotoUri] = useState(recipe?.coverPhotoUri);
  const [emoji, setEmoji] = useState(recipe?.emoji ?? '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>(recipe?.ingredients.map((item) => ({ ...item })) ?? [{ id: makeId(), name: '', quantity: '', unit: '' }]);
  const [steps, setSteps] = useState<RecipeStep[]>(recipe?.steps.map((item) => ({ ...item })) ?? [{ id: makeId(), instruction: '' }]);

  const chooseCoverPhoto = async () => {
    const uri = await pickPhoto([4, 3]);
    if (uri) {
      setCoverPhotoUri(uri);
      setEmoji('');
    }
  };

  const chooseStepPhoto = async (index: number) => {
    const uri = await pickPhoto([4, 3]);
    if (!uri) return;
    setSteps((current) => current.map((item, i) => i === index ? { ...item, photoUri: uri } : item));
  };

  const save = () => {
    if (!name.trim()) return;
    onSave({
      id: recipe?.id ?? makeId(),
      name: name.trim(),
      cookTime: cookTime.trim() || 'Time not set',
      favorite: recipe?.favorite ?? false,
      onMenu: recipe?.onMenu,
      coverPhotoUri,
      emoji: coverPhotoUri ? undefined : emoji || undefined,
      ingredients: ingredients.filter((item) => item.name.trim()),
      steps: steps.filter((item) => item.instruction.trim()),
    });
  };

  return (
    <View style={styles.flex}>
      <PageHeader title={mode === 'new' ? 'New Recipe' : 'Edit Recipe'} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pageCompact} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.coverPicker} onPress={chooseCoverPhoto}>
          {coverPhotoUri ? <Image source={{ uri: coverPhotoUri }} style={styles.coverPickerImage} /> : emoji ? <Text style={styles.coverPickerEmoji}>{emoji}</Text> : <Text style={styles.imagePlaceholderText}>＋ Add a Recipe Photo</Text>}
        </Pressable>

        <View style={styles.visualChoiceRow}>
          <Pressable style={styles.smallOutlineButton} onPress={chooseCoverPhoto}><Text style={styles.smallOutlineText}>{coverPhotoUri ? 'Change Photo' : 'Choose Photo'}</Text></Pressable>
          <Pressable style={styles.smallOutlineButton} onPress={() => setShowEmojiPicker((current) => !current)}><Text style={styles.smallOutlineText}>Choose Emoji</Text></Pressable>
          {(coverPhotoUri || emoji) && <Pressable style={styles.clearVisualButton} onPress={() => { setCoverPhotoUri(undefined); setEmoji(''); }}><Text style={styles.clearVisualText}>Clear</Text></Pressable>}
        </View>

        {showEmojiPicker && (
          <View style={styles.emojiPickerCard}>
            <Text style={styles.inputLabel}>Pick an emoji instead of a photo</Text>
            <View style={styles.emojiGrid}>{emojiOptions.map((option) => <Pressable key={option} style={[styles.emojiOption, emoji === option && styles.emojiOptionSelected]} onPress={() => { setEmoji(option); setCoverPhotoUri(undefined); setShowEmojiPicker(false); }}><Text style={styles.emojiOptionText}>{option}</Text></Pressable>)}</View>
          </View>
        )}

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
        <Pressable style={styles.outlineButton} onPress={() => setIngredients((current) => [...current, { id: makeId(), name: '', quantity: '', unit: '' }])}><Text style={styles.outlineText}>＋ Add Ingredient</Text></Pressable>

        <Text style={styles.sectionTitle}>Instructions</Text>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepEditorCard}>
            <View style={styles.stepEditorTopRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
              <TextInput style={[styles.input, styles.stepInput]} placeholder="What happens in this step?" multiline value={step.instruction} onChangeText={(value) => setSteps((current) => current.map((item, i) => i === index ? { ...item, instruction: value } : item))} />
            </View>
            {step.photoUri && <Image source={{ uri: step.photoUri }} style={styles.stepEditorPhoto} />}
            <View style={styles.stepEditorActions}>
              <Pressable style={styles.stepPhotoButton} onPress={() => chooseStepPhoto(index)}><Text style={styles.stepPhotoPlus}>＋</Text><Text style={styles.stepPhotoLabel}>{step.photoUri ? 'Change Step Photo' : 'Add Step Photo'}</Text></Pressable>
              {step.photoUri && <Pressable style={styles.stepRemovePhotoButton} onPress={() => setSteps((current) => current.map((item, i) => i === index ? { ...item, photoUri: undefined } : item))}><Text style={styles.deleteText}>Photo ×</Text></Pressable>}
              <Pressable style={styles.stepRemoveButton} onPress={() => setSteps((current) => current.filter((_, i) => i !== index))}><Text style={styles.deleteText}>×</Text></Pressable>
            </View>
          </View>
        ))}

        <Pressable style={styles.outlineButton} onPress={() => setSteps((current) => [...current, { id: makeId(), instruction: '' }])}><Text style={styles.outlineText}>＋ Add Step</Text></Pressable>

        <View style={styles.editorFooter}>
          {mode === 'edit' && onDelete && <Pressable style={styles.deleteButton} onPress={onDelete}><Text style={styles.deleteButtonText}>Delete</Text></Pressable>}
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
        <View style={styles.addItemRow}><TextInput style={[styles.input, styles.addItemInput]} placeholder="Add an item" value={newItem} onChangeText={setNewItem} onSubmitEditing={addItem} /><Pressable style={styles.smallButton} onPress={addItem}><Text style={styles.fullButtonText}>Add</Text></Pressable></View>
        <View style={styles.card}>
          {items.map((item) => (
            <View key={item.id} style={styles.groceryRow}>
              <Pressable onPress={() => onChange(items.map((current) => current.id === item.id ? { ...current, completed: !current.completed } : current))}><View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>{item.completed && <Text style={styles.checkmark}>✓</Text>}</View></Pressable>
              <View style={styles.recipeListInfo}><Text style={[styles.listText, item.completed && styles.completedText]}>{item.name}</Text>{(item.quantity || item.unit) && <Text style={styles.muted}>{item.quantity} {item.unit}</Text>}</View>
              <Pressable hitSlop={12} onPress={() => onChange(items.filter((current) => current.id !== item.id))}><Text style={styles.deleteText}>×</Text></Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const colors = {
  gold: '#F5AF2F',
  orange: '#E8492A',
  cream: '#FCE092',
  background: '#FFF9EC',
  card: '#FFFDF7',
  ink: '#2D2118',
  muted: '#7D6758',
  pale: '#FFF1C7',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  page: { paddingHorizontal: 22, paddingTop: 36, paddingBottom: 48 },
  pageCompact: { paddingHorizontal: 22, paddingBottom: 48 },
  header: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 38, fontWeight: '300', color: colors.ink, marginTop: -4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  greetingCard: { backgroundColor: colors.cream, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  muted: { color: colors.muted, fontSize: 14 },
  profileCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  profileIcon: { fontSize: 24, color: colors.ink },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 18, marginBottom: 6 },
  primaryAction: { flex: 1, minHeight: 112, backgroundColor: colors.orange, borderRadius: 18, padding: 18, justifyContent: 'space-between' },
  secondaryAction: { flex: 1, minHeight: 112, backgroundColor: colors.gold, borderRadius: 18, padding: 18, justifyContent: 'space-between' },
  actionPlus: { fontSize: 32, color: colors.ink },
  actionPlusLight: { fontSize: 32, color: '#fff' },
  primaryActionText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryActionText: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: 18, marginBottom: 10 },
  textLink: { fontSize: 13, fontWeight: '700', color: colors.orange },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginBottom: 8 },
  listRow: { flexDirection: 'row', alignItems: 'center', minHeight: 30, gap: 10 },
  listText: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  checkbox: { width: 19, height: 19, borderWidth: 1.5, borderColor: colors.orange, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.orange, borderColor: colors.orange },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  completedText: { textDecorationLine: 'line-through', color: '#A78F7E' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuRecipeCard: { width: '48%', backgroundColor: colors.card, borderRadius: 18, padding: 12, position: 'relative' },
  menuCardRemove: { position: 'absolute', top: 8, right: 8, zIndex: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  menuCardRemoveText: { fontSize: 20, color: '#fff', marginTop: -1 },
  imagePlaceholder: { height: 150, borderRadius: 14, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center', marginBottom: 10, width: '100%' },
  coverImage: { height: 220, width: '100%', borderRadius: 18, marginBottom: 18 },
  emojiCover: { height: 220, width: '100%', borderRadius: 18, marginBottom: 18, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 96 },
  listImage: { width: 74, height: 74, borderRadius: 14 },
  listEmojiBox: { width: 74, height: 74, borderRadius: 14, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
  listEmoji: { fontSize: 36 },
  listImagePlaceholder: { width: 74, height: 74, borderRadius: 14, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { color: colors.muted, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginBottom: 12 },
  searchInput: { flex: 1, marginBottom: 0 },
  filterButton: { width: 52, height: 48, borderRadius: 14, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  filterButtonActive: { backgroundColor: colors.orange },
  filterText: { fontSize: 20, color: colors.orange },
  filterTextActive: { fontSize: 20, color: '#fff' },
  recipeListCard: { backgroundColor: colors.card, borderRadius: 18, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recipeListInfo: { flex: 1 },
  recipeName: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  heart: { fontSize: 28, color: colors.orange },
  floatingButton: { position: 'absolute', right: 24, bottom: 28, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  floatingButtonText: { color: '#fff', fontSize: 34, fontWeight: '300' },
  detailTitle: { fontSize: 28, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  fullButton: { minHeight: 50, borderRadius: 14, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 18, marginBottom: 8 },
  fullButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 38, borderBottomWidth: 1, borderBottomColor: '#F4E4CB' },
  stepCard: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 12, flexDirection: 'row', gap: 12 },
  stepNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontWeight: '800', color: colors.ink },
  stepContent: { flex: 1 },
  stepText: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  stepPhotoPreview: { height: 150, width: '100%', marginTop: 10, borderRadius: 12 },
  editButton: { minHeight: 48, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  editButtonText: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  inputLabel: { fontWeight: '800', color: colors.ink, marginBottom: 6, marginTop: 4 },
  input: { minHeight: 48, backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, color: colors.ink, marginBottom: 12 },
  coverPicker: { height: 220, backgroundColor: colors.pale, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  coverPickerImage: { width: '100%', height: '100%' },
  coverPickerEmoji: { fontSize: 96 },
  visualChoiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  smallOutlineButton: { borderWidth: 1.5, borderColor: colors.gold, borderRadius: 12, paddingHorizontal: 12, minHeight: 40, justifyContent: 'center', backgroundColor: colors.card },
  smallOutlineText: { color: colors.ink, fontWeight: '700' },
  clearVisualButton: { borderRadius: 12, paddingHorizontal: 12, minHeight: 40, justifyContent: 'center', backgroundColor: colors.orange },
  clearVisualText: { color: '#fff', fontWeight: '700' },
  emojiPickerCard: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 14 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
  emojiOptionSelected: { borderWidth: 2, borderColor: colors.orange },
  emojiOptionText: { fontSize: 26 },
  ingredientInputs: { flexDirection: 'row', gap: 8 },
  quantityInput: { width: 70 },
  unitInput: { width: 82 },
  nameInput: { flex: 1 },
  outlineButton: { minHeight: 48, borderWidth: 1.5, borderColor: colors.gold, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: colors.card },
  outlineText: { color: colors.ink, fontWeight: '700' },
  stepEditorCard: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 12 },
  stepEditorTopRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepInput: { flex: 1, minHeight: 100, textAlignVertical: 'top', marginBottom: 0 },
  stepEditorPhoto: { width: '100%', height: 150, borderRadius: 12, marginTop: 12 },
  stepEditorActions: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'stretch' },
  stepPhotoButton: { flex: 1, minHeight: 72, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.orange, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pale },
  stepPhotoPlus: { fontSize: 26, color: colors.orange },
  stepPhotoLabel: { fontSize: 12, fontWeight: '700', color: colors.ink },
  stepRemovePhotoButton: { minWidth: 68, minHeight: 72, backgroundColor: colors.cream, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  stepRemoveButton: { width: 54, minHeight: 72, backgroundColor: colors.cream, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 18, color: colors.orange, fontWeight: '700' },
  editorFooter: { flexDirection: 'row', gap: 10, marginTop: 6 },
  deleteButton: { flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  deleteButtonText: { color: colors.orange, fontWeight: '800' },
  saveButton: { flex: 1 },
  addItemRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  addItemInput: { flex: 1, marginBottom: 0 },
  smallButton: { minWidth: 70, minHeight: 48, borderRadius: 14, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  groceryRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F4E4CB' },
});
