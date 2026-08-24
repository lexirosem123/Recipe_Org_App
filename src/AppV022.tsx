import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { initialGroceryItems, sampleRecipes } from './sampleData';
import { GroceryItem, Ingredient, Recipe, RecipeStep, ScreenName, UserProfile } from './types';

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emojiOptions = ['🍝','🍕','🥗','🍲','🥘','🌮','🍔','🥪','🍳','🥞','🍗','🥩','🍤','🍣','🍰','🧁','🍪','🥖'];
const PROFILE_KEY = 'recipe-organizer-profile';

async function chooseImage(source: 'camera' | 'library', aspect: [number, number] = [4, 3]) {
  const permission = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', source === 'camera' ? 'Please allow camera access to take photos.' : 'Please allow photo access to choose an image.');
    return undefined;
  }
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect, quality: 0.85 })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect, quality: 0.85 });
  return result.canceled ? undefined : result.assets[0]?.uri;
}

function askForImage(onPicked: (uri: string) => void, aspect: [number, number] = [4, 3]) {
  Alert.alert('Add Photo', 'Choose where the photo should come from.', [
    { text: 'Camera', onPress: async () => { const uri = await chooseImage('camera', aspect); if (uri) onPicked(uri); } },
    { text: 'Photo Library', onPress: async () => { const uri = await chooseImage('library', aspect); if (uri) onPicked(uri); } },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export default function AppV022() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(initialGroceryItems);
  const [selectedRecipeId, setSelectedRecipeId] = useState(sampleRecipes[0].id);
  const [menuRecipeIds, setMenuRecipeIds] = useState<string[]>([sampleRecipes[0].id]);
  const [profile, setProfile] = useState<UserProfile>({ name: '', email: '' });

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY).then((saved) => { if (saved) setProfile(JSON.parse(saved)); }).catch(() => undefined);
  }, []);

  const saveProfile = async (next: UserProfile) => {
    setProfile(next);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setScreen('home');
  };

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0];
  const menuRecipes = menuRecipeIds.map((id) => recipes.find((recipe) => recipe.id === id)).filter((r): r is Recipe => Boolean(r));
  const openRecipe = (id: string) => { setSelectedRecipeId(id); setScreen('recipe-detail'); };

  const addToMenu = (recipe: Recipe) => {
    if (!menuRecipeIds.includes(recipe.id)) setMenuRecipeIds((current) => [...current, recipe.id]);
    setGroceryItems((current) => {
      const existing = new Set(current.map((item) => item.name.toLowerCase()));
      return [...current, ...recipe.ingredients.filter((i) => !existing.has(i.name.toLowerCase())).map((i) => ({ id: makeId(), name: i.name, quantity: i.quantity, unit: i.unit, completed: false, recipeId: recipe.id }))];
    });
    setScreen('home');
  };

  const saveRecipe = (recipe: Recipe) => {
    setRecipes((current) => current.some((r) => r.id === recipe.id) ? current.map((r) => r.id === recipe.id ? recipe : r) : [recipe, ...current]);
    setSelectedRecipeId(recipe.id);
    setScreen('recipe-detail');
  };

  const deleteRecipe = (id: string) => {
    setRecipes((current) => current.filter((r) => r.id !== id));
    setMenuRecipeIds((current) => current.filter((r) => r !== id));
    setScreen('recipes');
  };

  return <SafeAreaView style={styles.safeArea}>
    <StatusBar style="dark" />
    {screen === 'home' && <HomeScreen profile={profile} groceryItems={groceryItems} menuRecipes={menuRecipes} onProfile={() => setScreen('profile')} onNewRecipe={() => setScreen('new-recipe')} onRecipes={() => setScreen('recipes')} onGrocery={() => setScreen('grocery')} onRecipe={openRecipe} onRemoveMenu={(id) => setMenuRecipeIds((c) => c.filter((r) => r !== id))} />}
    {screen === 'profile' && <ProfileScreen profile={profile} onBack={() => setScreen('home')} onSave={saveProfile} />}
    {screen === 'recipes' && <RecipesScreen recipes={recipes} onBack={() => setScreen('home')} onRecipe={openRecipe} onNewRecipe={() => setScreen('new-recipe')} onToggleFavorite={(id) => setRecipes((c) => c.map((r) => r.id === id ? { ...r, favorite: !r.favorite } : r))} />}
    {screen === 'recipe-detail' && selectedRecipe && <RecipeDetailScreen recipe={selectedRecipe} onBack={() => setScreen('recipes')} onEdit={() => setScreen('recipe-edit')} onAddToMenu={() => addToMenu(selectedRecipe)} />}
    {screen === 'recipe-edit' && selectedRecipe && <RecipeEditorScreen mode="edit" recipe={selectedRecipe} onBack={() => setScreen('recipe-detail')} onSave={saveRecipe} onDelete={() => deleteRecipe(selectedRecipe.id)} />}
    {screen === 'new-recipe' && <RecipeEditorScreen mode="new" onBack={() => setScreen('home')} onSave={saveRecipe} />}
    {screen === 'grocery' && <GroceryScreen items={groceryItems} onBack={() => setScreen('home')} onChange={setGroceryItems} />}
  </SafeAreaView>;
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return <View style={styles.header}><Pressable style={styles.backButton} onPress={onBack}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>{title}</Text><View style={styles.backButton} /></View>;
}

function ProfileAvatar({ profile, size = 46 }: { profile: UserProfile; size?: number }) {
  return profile.photoUri ? <Image source={{ uri: profile.photoUri }} style={{ width: size, height: size, borderRadius: size / 2 }} /> : <View style={[styles.profileCircle, { width: size, height: size, borderRadius: size / 2 }]}><Text style={[styles.profileIcon, { fontSize: size * .48 }]}>👤</Text></View>;
}

function HomeScreen({ profile, groceryItems, menuRecipes, onProfile, onNewRecipe, onRecipes, onGrocery, onRecipe, onRemoveMenu }: any) {
  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.greetingCard}>
      <View style={styles.greetingTextWrap}>
        <Text style={styles.heroTitle} numberOfLines={2}>{profile.name ? `Hello, ${profile.name}!` : 'Hello!'}</Text>
        <Text style={styles.muted}>What are we cooking up today?</Text>
      </View>
      <Pressable style={styles.homeProfileButton} onPress={onProfile}><ProfileAvatar profile={profile} /></Pressable>
    </View>
    <View style={styles.actionRow}><Pressable style={styles.primaryAction} onPress={onNewRecipe}><Text style={styles.actionPlusLight}>＋</Text><Text style={styles.primaryActionText}>New Recipe</Text></Pressable><Pressable style={styles.secondaryAction} onPress={onRecipes}><Text style={styles.actionPlus}>⌕</Text><Text style={styles.secondaryActionText}>All Recipes</Text></Pressable></View>
    <SectionTitle title="Grocery List" action="Edit List →" onPress={onGrocery} />
    <Pressable style={styles.card} onPress={onGrocery}>{groceryItems.slice(0,6).map((item: GroceryItem) => <View key={item.id} style={styles.listRow}><View style={[styles.checkbox,item.completed&&styles.checkboxChecked]}>{item.completed&&<Text style={styles.checkmark}>✓</Text>}</View><Text style={[styles.listText,item.completed&&styles.completedText]}>{item.name}</Text></View>)}</Pressable>
    <SectionTitle title="On The Menu" action="All recipes →" onPress={onRecipes} />
    <View style={styles.menuGrid}>{menuRecipes.map((recipe: Recipe) => <Pressable key={recipe.id} style={styles.menuRecipeCard} onPress={() => onRecipe(recipe.id)}><Pressable style={styles.menuCardRemove} onPress={() => onRemoveMenu(recipe.id)}><Text style={styles.menuCardRemoveText}>×</Text></Pressable><RecipeVisual recipe={recipe} menu/><Text style={styles.menuRecipeName} numberOfLines={1}>{recipe.name}</Text><Text style={styles.menuRecipeTime} numberOfLines={1}>{recipe.cookTime}</Text></Pressable>)}</View>
  </ScrollView>;
}

function ProfileScreen({ profile, onBack, onSave }: { profile: UserProfile; onBack: () => void; onSave: (p: UserProfile) => void }) {
  const [draft, setDraft] = useState(profile);
  return <View style={styles.flex}><Header title="Profile" onBack={onBack}/><ScrollView contentContainerStyle={styles.pageCompact}>
    <View style={styles.profileHero}><Pressable onPress={() => askForImage((uri) => setDraft({ ...draft, photoUri: uri }), [1,1])}><ProfileAvatar profile={draft} size={110} /></Pressable><Pressable style={styles.smallOutlineButton} onPress={() => askForImage((uri) => setDraft({ ...draft, photoUri: uri }), [1,1])}><Text style={styles.smallOutlineText}>{draft.photoUri ? 'Change Profile Photo' : 'Add Profile Photo'}</Text></Pressable>{draft.photoUri&&<Pressable onPress={() => setDraft({...draft,photoUri:undefined})}><Text style={styles.textLink}>Remove photo</Text></Pressable>}</View>
    <Text style={styles.inputLabel}>Name</Text><TextInput style={styles.input} placeholder="Your name" value={draft.name} onChangeText={(name) => setDraft({...draft,name})}/>
    <Text style={styles.inputLabel}>Email</Text><TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" value={draft.email} onChangeText={(email) => setDraft({...draft,email})}/>
    <Pressable style={styles.fullButton} onPress={() => onSave(draft)}><Text style={styles.fullButtonText}>Save Profile</Text></Pressable>
  </ScrollView></View>;
}

function SectionTitle({title,action,onPress}:any){return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={onPress}><Text style={styles.textLink}>{action}</Text></Pressable></View>}
function RecipeVisual({recipe,compact=false,menu=false}:{recipe:Recipe;compact?:boolean;menu?:boolean}){
  if(recipe.coverPhotoUri)return <Image source={{uri:recipe.coverPhotoUri}} resizeMode="cover" style={compact?styles.listImage:menu?styles.menuCoverImage:styles.coverImage}/>;
  if(recipe.emoji)return <View style={compact?styles.listEmojiBox:menu?styles.menuEmojiCover:styles.emojiCover}><Text style={compact?styles.listEmoji:menu?styles.menuEmoji:styles.coverEmoji}>{recipe.emoji}</Text></View>;
  return <View style={compact?styles.listImagePlaceholder:menu?styles.menuImagePlaceholder:styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>Recipe Image</Text></View>
}

function RecipesScreen({recipes,onBack,onRecipe,onToggleFavorite,onNewRecipe}:any){const[query,setQuery]=useState('');const[favoritesOnly,setFavoritesOnly]=useState(false);const filtered=useMemo(()=>recipes.filter((r:Recipe)=>r.name.toLowerCase().includes(query.trim().toLowerCase())&&(!favoritesOnly||r.favorite)),[recipes,query,favoritesOnly]);return <View style={styles.flex}><Header title="Recipes" onBack={onBack}/><View style={styles.searchRow}><TextInput style={[styles.input,styles.searchInput]} placeholder="Search recipes..." value={query} onChangeText={setQuery}/><Pressable style={[styles.filterButton,favoritesOnly&&styles.filterButtonActive]} onPress={()=>setFavoritesOnly(!favoritesOnly)}><Text style={favoritesOnly?styles.filterTextActive:styles.filterText}>♥</Text></Pressable></View><ScrollView contentContainerStyle={styles.pageCompact}>{filtered.map((r:Recipe)=><Pressable key={r.id} style={styles.recipeListCard} onPress={()=>onRecipe(r.id)}><RecipeVisual recipe={r} compact/><View style={styles.recipeListInfo}><Text style={styles.recipeName}>{r.name}</Text><Text style={styles.muted}>{r.cookTime}</Text></View><Pressable onPress={()=>onToggleFavorite(r.id)}><Text style={styles.heart}>{r.favorite?'♥':'♡'}</Text></Pressable></Pressable>)}</ScrollView><Pressable style={styles.floatingButton} onPress={onNewRecipe}><Text style={styles.floatingButtonText}>＋</Text></Pressable></View>}

function RecipeDetailScreen({recipe,onBack,onEdit,onAddToMenu}:any){return <View style={styles.flex}><Header title="Recipe" onBack={onBack}/><ScrollView contentContainerStyle={styles.pageCompact}><RecipeVisual recipe={recipe}/><Text style={styles.detailTitle}>{recipe.name}</Text><Text style={styles.muted}>{recipe.cookTime}</Text><Pressable style={styles.fullButton} onPress={onAddToMenu}><Text style={styles.fullButtonText}>Add To The Menu</Text></Pressable><Text style={styles.sectionTitle}>Ingredients</Text><View style={styles.card}>{recipe.ingredients.map((i:Ingredient)=><View key={i.id} style={styles.ingredientRow}><Text style={styles.listText}>{i.name}</Text><Text style={styles.muted}>{i.quantity} {i.unit}</Text></View>)}</View><Text style={styles.sectionTitle}>Instructions</Text>{recipe.steps.map((s:RecipeStep,index:number)=><View key={s.id} style={styles.stepCard}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index+1}</Text></View><View style={styles.stepContent}><Text style={styles.stepText}>{s.instruction}</Text>{s.photoUri&&<Image source={{uri:s.photoUri}} style={styles.stepPhotoPreview}/>}</View></View>)}<Pressable style={styles.editButton} onPress={onEdit}><Text style={styles.editButtonText}>Edit</Text></Pressable></ScrollView></View>}

function RecipeEditorScreen({mode,recipe,onBack,onSave,onDelete}:any){const[name,setName]=useState(recipe?.name??'');const[cookTime,setCookTime]=useState(recipe?.cookTime??'');const[coverPhotoUri,setCoverPhotoUri]=useState(recipe?.coverPhotoUri);const[emoji,setEmoji]=useState(recipe?.emoji??'');const[showEmojiPicker,setShowEmojiPicker]=useState(false);const[ingredients,setIngredients]=useState<Ingredient[]>(recipe?.ingredients?.map((i:Ingredient)=>({...i}))??[{id:makeId(),name:'',quantity:'',unit:''}]);const[steps,setSteps]=useState<RecipeStep[]>(recipe?.steps?.map((s:RecipeStep)=>({...s}))??[{id:makeId(),instruction:''}]);const save=()=>{if(!name.trim())return;onSave({id:recipe?.id??makeId(),name:name.trim(),cookTime:cookTime.trim()||'Time not set',favorite:recipe?.favorite??false,coverPhotoUri,emoji:coverPhotoUri?undefined:emoji||undefined,ingredients:ingredients.filter(i=>i.name.trim()),steps:steps.filter(s=>s.instruction.trim())})};return <View style={styles.flex}><Header title={mode==='new'?'New Recipe':'Edit Recipe'} onBack={onBack}/><ScrollView contentContainerStyle={styles.pageCompact} keyboardShouldPersistTaps="handled"><Pressable style={styles.coverPicker} onPress={()=>askForImage((uri)=>{setCoverPhotoUri(uri);setEmoji('')})}>{coverPhotoUri?<Image source={{uri:coverPhotoUri}} style={styles.coverPickerImage}/>:emoji?<Text style={styles.coverPickerEmoji}>{emoji}</Text>:<Text style={styles.imagePlaceholderText}>＋ Add a Recipe Photo</Text>}</Pressable><View style={styles.visualChoiceRow}><Pressable style={styles.smallOutlineButton} onPress={()=>askForImage((uri)=>{setCoverPhotoUri(uri);setEmoji('')})}><Text style={styles.smallOutlineText}>{coverPhotoUri?'Change Photo':'Camera / Gallery'}</Text></Pressable><Pressable style={styles.smallOutlineButton} onPress={()=>setShowEmojiPicker(!showEmojiPicker)}><Text style={styles.smallOutlineText}>Choose Emoji</Text></Pressable></View>{showEmojiPicker&&<View style={styles.emojiPickerCard}><View style={styles.emojiGrid}>{emojiOptions.map(e=><Pressable key={e} style={styles.emojiOption} onPress={()=>{setEmoji(e);setCoverPhotoUri(undefined);setShowEmojiPicker(false)}}><Text style={styles.emojiOptionText}>{e}</Text></Pressable>)}</View></View>}<Text style={styles.inputLabel}>Recipe Name</Text><TextInput style={styles.input} value={name} onChangeText={setName}/><Text style={styles.inputLabel}>Time</Text><TextInput style={styles.input} value={cookTime} onChangeText={setCookTime}/><Text style={styles.sectionTitle}>Ingredients</Text>{ingredients.map((i,index)=><View key={i.id} style={styles.ingredientInputs}><TextInput style={[styles.input,styles.quantityInput]} placeholder="Qty" value={i.quantity} onChangeText={v=>setIngredients(c=>c.map((x,n)=>n===index?{...x,quantity:v}:x))}/><TextInput style={[styles.input,styles.unitInput]} placeholder="Unit" value={i.unit} onChangeText={v=>setIngredients(c=>c.map((x,n)=>n===index?{...x,unit:v}:x))}/><TextInput style={[styles.input,styles.nameInput]} placeholder="Ingredient" value={i.name} onChangeText={v=>setIngredients(c=>c.map((x,n)=>n===index?{...x,name:v}:x))}/></View>)}<Pressable style={styles.outlineButton} onPress={()=>setIngredients(c=>[...c,{id:makeId(),name:'',quantity:'',unit:''}])}><Text style={styles.outlineText}>＋ Add Ingredient</Text></Pressable><Text style={styles.sectionTitle}>Instructions</Text>{steps.map((s,index)=><View key={s.id} style={styles.stepEditorCard}><View style={styles.stepEditorTopRow}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index+1}</Text></View><TextInput style={[styles.input,styles.stepInput]} multiline value={s.instruction} onChangeText={v=>setSteps(c=>c.map((x,n)=>n===index?{...x,instruction:v}:x))}/></View>{s.photoUri&&<Image source={{uri:s.photoUri}} style={styles.stepEditorPhoto}/>}<View style={styles.stepEditorActions}><Pressable style={styles.stepPhotoButton} onPress={()=>askForImage(uri=>setSteps(c=>c.map((x,n)=>n===index?{...x,photoUri:uri}:x)))}><Text style={styles.stepPhotoPlus}>＋</Text><Text style={styles.stepPhotoLabel}>{s.photoUri?'Change Step Photo':'Add Step Photo'}</Text></Pressable><Pressable style={styles.stepRemoveButton} onPress={()=>setSteps(c=>c.filter((_,n)=>n!==index))}><Text style={styles.deleteText}>×</Text></Pressable></View></View>)}<Pressable style={styles.outlineButton} onPress={()=>setSteps(c=>[...c,{id:makeId(),instruction:''}])}><Text style={styles.outlineText}>＋ Add Step</Text></Pressable><View style={styles.editorFooter}>{mode==='edit'&&onDelete&&<Pressable style={styles.deleteButton} onPress={onDelete}><Text style={styles.deleteButtonText}>Delete</Text></Pressable>}<Pressable style={[styles.fullButton,styles.saveButton]} onPress={save}><Text style={styles.fullButtonText}>Save Recipe</Text></Pressable></View></ScrollView></View>}

function GroceryScreen({items,onBack,onChange}:any){const[newItem,setNewItem]=useState('');const add=()=>{if(!newItem.trim())return;onChange([...items,{id:makeId(),name:newItem.trim(),completed:false}]);setNewItem('')};return <View style={styles.flex}><Header title="Grocery List" onBack={onBack}/><ScrollView contentContainerStyle={styles.pageCompact}><View style={styles.addItemRow}><TextInput style={[styles.input,styles.addItemInput]} value={newItem} onChangeText={setNewItem} onSubmitEditing={add}/><Pressable style={styles.smallButton} onPress={add}><Text style={styles.fullButtonText}>Add</Text></Pressable></View><View style={styles.card}>{items.map((i:GroceryItem)=><View key={i.id} style={styles.groceryRow}><Pressable onPress={()=>onChange(items.map((x:GroceryItem)=>x.id===i.id?{...x,completed:!x.completed}:x))}><View style={[styles.checkbox,i.completed&&styles.checkboxChecked]}>{i.completed&&<Text style={styles.checkmark}>✓</Text>}</View></Pressable><View style={styles.recipeListInfo}><Text style={[styles.listText,i.completed&&styles.completedText]}>{i.name}</Text></View><Pressable onPress={()=>onChange(items.filter((x:GroceryItem)=>x.id!==i.id))}><Text style={styles.deleteText}>×</Text></Pressable></View>)}</View></ScrollView></View>}

const colors={gold:'#F5AF2F',orange:'#E8492A',cream:'#FCE092',background:'#FFF9EC',card:'#FFFDF7',ink:'#2D2118',muted:'#7D6758',pale:'#FFF1C7'};
const styles=StyleSheet.create({
  safeArea:{flex:1,backgroundColor:colors.background,paddingTop:16},flex:{flex:1},page:{paddingHorizontal:22,paddingTop:24,paddingBottom:48},pageCompact:{paddingHorizontal:22,paddingBottom:48},header:{height:64,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},backButton:{width:44,height:44,alignItems:'center',justifyContent:'center'},backText:{fontSize:38,color:colors.ink},headerTitle:{fontSize:18,fontWeight:'700',color:colors.ink},
  greetingCard:{backgroundColor:colors.cream,borderRadius:18,padding:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},greetingTextWrap:{flex:1,minWidth:0,paddingRight:4},homeProfileButton:{flexShrink:0},heroTitle:{fontSize:23,lineHeight:27,fontWeight:'800',color:colors.ink,flexShrink:1},muted:{color:colors.muted,fontSize:14},profileCircle:{backgroundColor:colors.gold,alignItems:'center',justifyContent:'center'},profileIcon:{color:colors.ink},profileHero:{alignItems:'center',gap:12,marginBottom:24},
  actionRow:{flexDirection:'row',gap:12,marginTop:18,marginBottom:6},primaryAction:{flex:1,minHeight:112,backgroundColor:colors.orange,borderRadius:18,padding:18,justifyContent:'space-between'},secondaryAction:{flex:1,minHeight:112,backgroundColor:colors.gold,borderRadius:18,padding:18,justifyContent:'space-between'},actionPlus:{fontSize:32,color:colors.ink},actionPlusLight:{fontSize:32,color:'#fff'},primaryActionText:{color:'#fff',fontWeight:'700',fontSize:16},secondaryActionText:{color:colors.ink,fontWeight:'700',fontSize:16},sectionHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:18,marginBottom:10},sectionTitle:{fontSize:18,fontWeight:'800',color:colors.ink,marginTop:18,marginBottom:10},textLink:{fontSize:13,fontWeight:'700',color:colors.orange},card:{backgroundColor:colors.card,borderRadius:18,padding:16,marginBottom:8},listRow:{flexDirection:'row',alignItems:'center',minHeight:30,gap:10},listText:{color:colors.ink,fontSize:15,fontWeight:'600'},checkbox:{width:19,height:19,borderWidth:1.5,borderColor:colors.orange,borderRadius:4,alignItems:'center',justifyContent:'center'},checkboxChecked:{backgroundColor:colors.orange},checkmark:{color:'#fff',fontSize:12,fontWeight:'800'},completedText:{textDecorationLine:'line-through',color:'#A78F7E'},
  menuGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},menuRecipeCard:{width:'48%',aspectRatio:1,backgroundColor:colors.card,borderRadius:18,padding:12,position:'relative',overflow:'hidden'},menuCardRemove:{position:'absolute',top:8,right:8,zIndex:2,width:30,height:30,borderRadius:15,backgroundColor:colors.orange,alignItems:'center',justifyContent:'center'},menuCardRemoveText:{fontSize:20,color:'#fff'},menuCoverImage:{width:'100%',height:82,borderRadius:12,marginBottom:8},menuEmojiCover:{width:'100%',height:82,borderRadius:12,marginBottom:8,backgroundColor:colors.pale,alignItems:'center',justifyContent:'center'},menuEmoji:{fontSize:42},menuImagePlaceholder:{width:'100%',height:82,borderRadius:12,marginBottom:8,backgroundColor:colors.pale,alignItems:'center',justifyContent:'center'},menuRecipeName:{color:colors.ink,fontSize:15,fontWeight:'800',marginBottom:2},menuRecipeTime:{color:colors.muted,fontSize:12},
  imagePlaceholder:{height:150,borderRadius:14,backgroundColor:colors.pale,alignItems:'center',justifyContent:'center',marginBottom:10,width:'100%'},coverImage:{height:220,width:'100%',borderRadius:18,marginBottom:18},emojiCover:{height:220,width:'100%',borderRadius:18,marginBottom:18,backgroundColor:colors.pale,alignItems:'center',justifyContent:'center'},coverEmoji:{fontSize:96},listImage:{width:74,height:74,borderRadius:14},listEmojiBox:{width:74,height:74,borderRadius:14,backgroundColor:colors.pale,alignItems:'center',justifyContent:'center'},listEmoji:{fontSize:36},listImagePlaceholder:{width:74,height:74,borderRadius:14,backgroundColor:colors.pale,alignItems:'center',justifyContent:'center'},imagePlaceholderText:{color:colors.muted,fontSize:12,fontWeight:'700',textAlign:'center'},searchRow:{flexDirection:'row',gap:10,paddingHorizontal:22,marginBottom:12},searchInput:{flex:1,marginBottom:0},filterButton:{width:52,height:48,borderRadius:14,backgroundColor:colors.gold,alignItems:'center',justifyContent:'center'},filterButtonActive:{backgroundColor:colors.orange},filterText:{fontSize:20,color:colors.ink},filterTextActive:{fontSize:20,color:'#fff'},recipeListCard:{backgroundColor:colors.card,borderRadius:18,padding:12,marginBottom:12,flexDirection:'row',alignItems:'center',gap:12},recipeListInfo:{flex:1},recipeName:{color:colors.ink,fontSize:17,fontWeight:'800',marginBottom:4},heart:{fontSize:28,color:colors.orange},floatingButton:{position:'absolute',right:24,bottom:28,width:64,height:64,borderRadius:32,backgroundColor:colors.orange,alignItems:'center',justifyContent:'center'},floatingButtonText:{color:'#fff',fontSize:34},detailTitle:{fontSize:28,fontWeight:'800',color:colors.ink},fullButton:{minHeight:50,borderRadius:14,backgroundColor:colors.orange,alignItems:'center',justifyContent:'center',paddingHorizontal:18,marginTop:18,marginBottom:8},fullButtonText:{color:'#fff',fontSize:15,fontWeight:'800'},ingredientRow:{flexDirection:'row',justifyContent:'space-between',minHeight:38,alignItems:'center'},stepCard:{backgroundColor:colors.card,borderRadius:18,padding:14,marginBottom:12,flexDirection:'row',gap:12},stepNumber:{width:30,height:30,borderRadius:15,backgroundColor:colors.gold,alignItems:'center',justifyContent:'center'},stepNumberText:{fontWeight:'800',color:colors.ink},stepContent:{flex:1},stepText:{fontSize:14,color:colors.ink,lineHeight:20},stepPhotoPreview:{height:150,width:'100%',marginTop:10,borderRadius:12},editButton:{minHeight:48,borderRadius:14,backgroundColor:colors.cream,alignItems:'center',justifyContent:'center',marginTop:8},editButtonText:{color:colors.orange,fontWeight:'800'},inputLabel:{fontWeight:'800',color:colors.ink,marginBottom:6,marginTop:4},input:{minHeight:48,backgroundColor:colors.card,borderRadius:14,paddingHorizontal:14,color:colors.ink,marginBottom:12},coverPicker:{height:220,borderRadius:18,backgroundColor:colors.pale,alignItems:'center',justifyContent:'center',marginBottom:10,overflow:'hidden'},coverPickerImage:{width:'100%',height:'100%'},coverPickerEmoji:{fontSize:96},visualChoiceRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},smallOutlineButton:{borderWidth:1.5,borderColor:colors.gold,borderRadius:12,paddingHorizontal:12,minHeight:40,justifyContent:'center',backgroundColor:colors.card},smallOutlineText:{color:colors.ink,fontWeight:'700'},emojiPickerCard:{backgroundColor:colors.card,borderRadius:18,padding:14,marginBottom:14},emojiGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},emojiOption:{width:48,height:48,borderRadius:12,backgroundColor:colors.pale,alignItems:'center',justifyContent:'center'},emojiOptionText:{fontSize:26},ingredientInputs:{flexDirection:'row',gap:8},quantityInput:{width:70},unitInput:{width:82},nameInput:{flex:1},outlineButton:{minHeight:48,borderWidth:1.5,borderColor:colors.gold,borderRadius:14,alignItems:'center',justifyContent:'center',marginBottom:12,backgroundColor:colors.card},outlineText:{color:colors.ink,fontWeight:'700'},stepEditorCard:{backgroundColor:colors.card,borderRadius:18,padding:14,marginBottom:12},stepEditorTopRow:{flexDirection:'row',gap:10},stepInput:{flex:1,minHeight:100,textAlignVertical:'top'},stepEditorPhoto:{width:'100%',height:150,borderRadius:12,marginTop:12},stepEditorActions:{flexDirection:'row',gap:8,marginTop:12},stepPhotoButton:{flex:1,minHeight:72,borderWidth:1.5,borderStyle:'dashed',borderColor:colors.orange,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:colors.pale},stepPhotoPlus:{fontSize:26,color:colors.orange},stepPhotoLabel:{fontSize:12,fontWeight:'700',color:colors.ink},stepRemoveButton:{width:54,minHeight:72,backgroundColor:colors.cream,borderRadius:14,alignItems:'center',justifyContent:'center'},deleteText:{fontSize:18,color:colors.orange,fontWeight:'700'},editorFooter:{flexDirection:'row',gap:10,marginTop:6},deleteButton:{flex:1,minHeight:50,borderRadius:14,backgroundColor:colors.cream,alignItems:'center',justifyContent:'center',marginTop:18},deleteButtonText:{color:colors.orange,fontWeight:'800'},saveButton:{flex:1},addItemRow:{flexDirection:'row',gap:10,marginBottom:12},addItemInput:{flex:1,marginBottom:0},smallButton:{minWidth:70,minHeight:48,borderRadius:14,backgroundColor:colors.orange,alignItems:'center',justifyContent:'center'},groceryRow:{minHeight:52,flexDirection:'row',alignItems:'center',gap:12}
});
