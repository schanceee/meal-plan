/**
 * recipes.js — localStorage data layer for the meal plan app.
 * Works in browser (global) and Node.js (CommonJS exports for testing).
 */

const STORAGE_KEY = 'recipeData';
let _idSeq = 0;
function _uid() { return 'custom-' + Date.now() + '-' + (++_idSeq); }

function getAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function _save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function get(id) {
  return getAll()[id] || {};
}

function set(id, updates) {
  const all = getAll();
  all[id] = Object.assign(all[id] || {}, updates);
  _save(all);
  return all[id];
}

function remove(id) {
  const all = getAll();
  delete all[id];
  _save(all);
}

function getSaved() {
  const all = getAll();
  return Object.entries(all)
    .filter(([, r]) => r.saved)
    .map(([id, r]) => Object.assign({ id }, r));
}

/**
 * Add a new custom recipe to the saved collection.
 */
function addCustomRecipe(recipe) {
  if (!recipe || !recipe.name || !recipe.name.trim()) {
    throw new Error('Recipe name is required');
  }
  const id = _uid();
  const data = {
    saved: true,
    custom: true,
    name: recipe.name.trim(),
    description: recipe.description || '',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    rating: 0,
    note: '',
    createdAt: Date.now(),
  };
  return set(id, data);
}

/**
 * Update fields on an existing recipe (built-in or custom).
 */
function updateCustomRecipe(id, updates) {
  const rec = get(id);
  if (!rec || !rec.name) throw new Error('Recipe not found');
  if (updates.name !== undefined && !updates.name.trim()) {
    throw new Error('Recipe name is required');
  }
  return set(id, updates);
}

/**
 * Search saved recipes.
 */
function searchSaved(query) {
  const all = getSaved();
  if (!query || !query.trim()) return all;
  const q = query.toLowerCase().trim();
  return all.filter(r =>
    (r.name || '').toLowerCase().includes(q) ||
    (r.description || '').toLowerCase().includes(q) ||
    (r.ingredients || []).some(i => i.toLowerCase().includes(q)) ||
    (r.tags || []).some(t => t.toLowerCase().includes(q))
  );
}

// ── Built-in recipe seed data ──────────────────────────────────────
var SEED_RECIPES = [
  { id:'pasta-miso', category:'main', color:'var(--green)',
    photoUrl:'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Pasta \xb7 caramelized onions \xb7 white miso \xb7 Gruy\xe8re \xb7 sage',
    description:'Deep umami pasta: onions melted for 45 min, white miso stirred in off the heat, melted AOP Gruy\xe8re, crispy sage.',
    tags:['vegetarian','miso'], servings:'4 servings', prepTime:'5 min', cookTime:'50 min',
    ingredients:['500g pasta (rigatoni or tagliatelle)','8 large yellow onions, finely sliced','2 tablespoons white miso (shiro miso)','150g AOP Gruy\xe8re, grated','20 fresh sage leaves','4 tablespoons olive oil','50g butter','200ml pasta cooking water (reserved)','Salt and black pepper'],
    instructions:['Melt the butter and oil in a large saut\xe9 pan over very low heat. Add the sliced onions and a pinch of salt. Caramelize for 40\u201345 min, stirring regularly until deeply golden.','Cook the pasta al dente according to package instructions. Reserve 200 ml of cooking water before draining.','In a small pan with 2 tablespoons of hot oil, fry the sage leaves for 30\u201360 seconds until crispy. Place on paper towel. Set aside.','Off the heat, stir the white miso into the onions with a ladle of cooking water. Mix until fully dissolved \u2014 do not boil after this to preserve probiotics.','Add the drained pasta to the onions. Add cooking water gradually, stirring to create a silky sauce.','Stir in the grated Gruy\xe8re off the heat. Mix until melted. Adjust seasoning.','Serve immediately with the crispy sage leaves on top.'] },

  { id:'bol-cereales', category:'main', color:'var(--green)',
    photoUrl:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Grain bowl \xb7 roasted veg \xb7 lentils \xb7 tahini-tamari',
    description:'Nourishing bowl assembled from Sunday prep: farro, lentils, roasted root vegetables, tahini-tamari-lemon dressing. 10 minutes of assembly.',
    tags:['vegetarian','tamari'], servings:'4 servings', prepTime:'10 min', cookTime:'0 min',
    ingredients:['300g cooked farro or spelt','200g cooked green lentils','4 roasted beets, quartered','4 roasted carrots','200g roasted celeriac','200g fresh spinach','4 tablespoons tahini','2 lemons, juice','2 tablespoons tamari','1 garlic clove, grated','4 tablespoons toasted sunflower seeds','Wild garlic oil','Salt and pepper'],
    instructions:['Warm the farro and lentils together in a pan with a splash of water or stock, 3\u20134 min over medium heat.','Wilt the spinach quickly in the same pan with a drop of oil and a pinch of salt, 1\u20132 min.','Make the dressing: mix tahini, lemon juice, tamari and grated garlic. Add hot water spoonful by spoonful until you get a creamy, pourable consistency.','Warm the roasted vegetables (beets, carrots, celeriac) if needed \u2014 2 min over low heat or in the microwave.','Assemble in bowls: farro + lentils as base, roasted vegetables on top, spinach on the side.','Drizzle with tahini-tamari dressing. Sprinkle with toasted sunflower seeds. Finish with a drizzle of wild garlic oil.'] },

  { id:'poulet-chou-savoie', category:'main', color:'var(--red)',
    photoUrl:'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Braised chicken \xb7 Savoy cabbage \xb7 whole-grain mustard',
    description:'Chicken thighs seared then braised in white wine with a dash of apple cider vinegar, melted Savoy cabbage, whole-grain mustard sauce.',
    tags:['meat'], shelfLife:'early', servings:'4 servings', prepTime:'10 min', cookTime:'45 min',
    ingredients:['4 chicken thighs (about 1.2 kg)','1 Savoy cabbage (about 800g)','200ml dry white wine','2 tablespoons apple cider vinegar','3 shallots, sliced','2 garlic cloves, crushed','2 tablespoons whole-grain mustard','100ml thick cr\xe8me fra\xeeche','2 tablespoons olive oil','3 thyme sprigs','2 bay leaves','Salt and pepper'],
    instructions:['Season the thighs skin-side with salt and pepper. In a casserole, heat oil over high heat. Place thighs skin-side down for 8 min without touching, until well golden. Flip, sear 2 min. Remove and set aside.','In the same casserole over medium heat, sweat the shallots and garlic for 3 min.','Deglaze with white wine, scraping up the fond. Add apple cider vinegar, thyme and bay leaves.','Return the chicken thighs. Cover and braise over low heat for 25 min.','Roughly slice the Savoy cabbage. Add to the casserole, stir, cover and cook another 12\u201315 min until the cabbage is soft but still slightly crisp.','Remove from heat. Stir in the whole-grain mustard and cr\xe8me fra\xeeche. Mix gently. Adjust seasoning. Do not boil after adding the cream.','Serve with sourdough bread for mopping up the sauce.'] },

  { id:'dal-lentilles', category:'main', color:'var(--green)',
    photoUrl:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Lentil Dal \xb7 cumin tadka \xb7 cold kefir \xb7 basmati rice',
    description:'Lentil Dal with cumin-coriander-tomato, finished with a tadka \u2014 sizzling butter poured with cumin seeds and chili \u2014 and served with cold kefir.',
    tags:['vegetarian','kefir'], servings:'4 servings', prepTime:'5 min', cookTime:'35 min',
    ingredients:['400g cooked green lentils (from Sunday prep)','1 can crushed tomatoes (400g)','2 teaspoons ground cumin','2 teaspoons ground coriander','1 teaspoon turmeric','1 onion, sliced','2 garlic cloves, chopped','2 tablespoons tamari','300g basmati rice','500ml kefir or whole fermented yogurt','For the tadka: 3 tablespoons butter','For the tadka: 1 tablespoon cumin seeds','For the tadka: 2 dried chilies','Olive oil, salt'],
    instructions:['Cook the basmati rice according to instructions. Keep warm.','Saut\xe9 the onion in olive oil for 5 min over medium heat until translucent. Add garlic, cook 1 min.','Add ground cumin, coriander and turmeric. Saut\xe9 1 min, stirring.','Add the crushed tomatoes. Cook 10 min over medium heat.','Stir in the cooked lentils and tamari. Heat together for 5 min. Adjust seasoning. Keep warm over very low heat.','TADKA: melt butter over high heat in a small pan. As soon as it foams, add cumin seeds and dried chilies. When the seeds pop and the butter smells nutty (30\u201345 sec), pour immediately over the Dal.','Serve the Dal over rice, with cold kefir on the side (do not mix it into the hot dish to preserve the ferments).'] },

  { id:'perche-lac', category:'main', color:'var(--blue)',
    photoUrl:'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Lake perch \xb7 wild garlic brown butter \xb7 spinach \xb7 crushed potatoes',
    description:'Crispy pan-fried lake perch fillets, brown butter with apple cider vinegar and wild garlic, crushed potatoes, spinach saut\xe9ed with lemon.',
    tags:['fish'], shelfLife:'first2', servings:'4 servings', prepTime:'5 min', cookTime:'30 min',
    ingredients:['4 Lake Geneva perch fillets with skin (or trout)','800g potatoes','300g fresh spinach','50g butter','3 tablespoons wild garlic oil','1 tablespoon apple cider vinegar','1 lemon','3 tablespoons olive oil','Sea salt, black pepper'],
    instructions:['Cook the potatoes whole in their skins in salted boiling water, 25 min. Drain, peel while still hot, crush roughly with 2 tablespoons olive oil and salt.','Pat the perch fillets dry with paper towel. Salt generously skin-side.','Heat a stainless steel or cast iron pan over high heat until lightly smoking. Add 1 tablespoon oil. Place fillets skin-side down. Press gently for 10 seconds to prevent curling. Cook 4 min without touching.','Flip the fillets, cook 45 seconds to 1 min. Remove to a plate.','In the same pan off the heat, melt butter until golden brown. Add wild garlic oil and apple cider vinegar. Pour immediately over the fillets.','Saut\xe9 the spinach in the remaining olive oil for 2 min over high heat. Squeeze half a lemon. Season.','Serve immediately: crushed potatoes, spinach, perch fillets drizzled with wild garlic butter.'] },

  { id:'salade-betteraves', category:'main', color:'var(--green)',
    photoUrl:'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Warm beet salad \xb7 lentils \xb7 farro \xb7 goat cheese \xb7 walnuts',
    description:'Weekend salad assembled in 5 min from prep: roasted beets, lentils, farro, crumbled goat cheese, toasted walnuts, tahini-orange-tamari dressing.',
    tags:['vegetarian'], servings:'4 servings', prepTime:'5 min', cookTime:'5 min',
    ingredients:['4 roasted beets (from prep), quartered','200g cooked green lentils (from prep)','200g cooked farro (from prep)','150g fresh goat cheese, crumbled','100g walnuts, toasted','1 orange \u2014 zest and juice','4 tablespoons tahini','2 tablespoons tamari','2 tablespoons apple cider vinegar','A few lamb\'s lettuce or rocket leaves (optional)','Salt, pepper'],
    instructions:['Toast the walnuts dry in a pan for 3\u20134 min until golden and fragrant. Set aside.','Warm beets, lentils and farro together in a pan with a drizzle of oil, 3\u20134 min.','Make the dressing: mix tahini, orange juice, tamari and apple cider vinegar. Thin with a little water if too thick.','Assemble in a large dish: grains and lentils as base, beets on top, grated orange zest.','Crumble goat cheese, scatter toasted walnuts.','Drizzle with dressing. Serve warm.'] },

  { id:'shakshuka', category:'main', color:'var(--green)',
    photoUrl:'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Spiced Shakshuka \xb7 roasted peppers \xb7 feta \xb7 wild garlic oil',
    description:'Tomato-pepper base with smoked paprika and harissa, eggs poached in the sauce, crumbled feta, wild garlic oil. One pan, 30 min.',
    tags:['vegetarian'], servings:'4 servings', prepTime:'5 min', cookTime:'30 min',
    ingredients:['2 cans crushed tomatoes (800g)','2 red peppers, roasted and peeled','6 eggs','150g feta','2 teaspoons smoked paprika','1 teaspoon ground cumin','2 tablespoons harissa','2 garlic cloves, chopped','1 onion, sliced','3 tablespoons wild garlic oil','Sourdough bread to serve','Salt, pepper'],
    instructions:['Roast the peppers directly over a flame or under the grill until charred. Place in a plastic bag for 10 min, then peel and slice.','Saut\xe9 the onion in olive oil for 5 min. Add garlic, 1 min.','Add smoked paprika and cumin. Saut\xe9 1 min.','Add crushed tomatoes, sliced roasted peppers and harissa. Stir, cover and simmer for 15 min over medium-low heat.','Make 6 wells in the sauce with a spoon. Crack an egg into each well.','Cover and cook: 8 min for runny yolks, 10 min for medium.','Crumble feta on top. Drizzle with wild garlic oil. Serve directly in the pan with sourdough bread.'] },

  { id:'tarte-poireaux', category:'main', color:'var(--green)',
    photoUrl:'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Thin leek tart \xb7 Gruy\xe8re \xb7 cr\xe8me fra\xeeche',
    description:'Thin puff pastry, leeks melted and deglazed with apple cider vinegar, cream-egg filling, generous Gruy\xe8re. Served with green salad and mustard vinaigrette.',
    tags:['vegetarian'], servings:'4 servings', prepTime:'10 min', cookTime:'45 min',
    ingredients:['1 roll puff pastry','4 leeks (about 600g), sliced','100g AOP Gruy\xe8re, grated','100ml thick cr\xe8me fra\xeeche','2 eggs','1 tablespoon apple cider vinegar','2 tablespoons olive oil','Salt, pepper, nutmeg','Green salad to accompany','Whole-grain mustard for the dressing'],
    instructions:['Preheat oven to 200\xb0C (fan).','Melt the sliced leeks in olive oil over low heat, 15 min, stirring. They should be very soft and lightly coloured. Deglaze with apple cider vinegar, stir, let evaporate 1 min.','In a bowl, mix cr\xe8me fra\xeeche, eggs, a pinch of nutmeg, salt and pepper.','Roll out puff pastry on a baking tray lined with parchment. Prick all over with a fork. Leave a 1.5 cm border.','Mix leeks with the cream-egg mixture. Pour over the pastry, respecting the border. Sprinkle generously with grated Gruy\xe8re.','Bake 25\u201330 min until the topping is golden and the base is crispy underneath.','Leave to cool for 5 min before cutting. Serve with green salad and mustard-cider vinegar dressing.'] },

  { id:'veloute-choufleur', category:'starter', color:'var(--green)',
    photoUrl:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Cauliflower velout\xe9 \xb7 white miso \xb7 hazelnuts \xb7 goat cheese toast',
    description:'Whole cauliflower roasted then blended into a silky velout\xe9 with leek and potato. White miso stirred in off the heat. Toasted hazelnuts and hazelnut oil.',
    tags:['vegetarian','miso'], servings:'4 servings', prepTime:'10 min', cookTime:'55 min',
    ingredients:['1 whole cauliflower (about 1 kg)','2 leeks, sliced','2 potatoes, peeled and diced','2 tablespoons white miso','1L vegetable stock','50g hazelnuts','2 tablespoons hazelnut oil','3 tablespoons olive oil','Fresh goat cheese for the toasts','Sourdough bread','Salt, pepper'],
    instructions:['Preheat oven to 200\xb0C. Brush the whole cauliflower with olive oil and salt. Place in an oven dish. Roast 40 min until well browned on the surface. Set aside a few florets for garnish.','Meanwhile, sweat the sliced leeks in olive oil for 5 min. Add diced potatoes.','Add vegetable stock. Cook 10 min at a gentle simmer.','Cut the roasted cauliflower into pieces (keep a few florets for garnish). Add to the pot. Blend at length until very smooth and silky.','OFF THE HEAT: dissolve white miso in a ladle of hot soup, then stir into the rest. Never boil after adding miso.','Toast the hazelnuts dry in a pan for 4\u20135 min. Roughly crush.','Serve the soup with the reserved roasted florets, crushed hazelnuts and a drizzle of hazelnut oil. Goat cheese toasts on the side.'] },

  { id:'soupe-miso', category:'starter', color:'var(--teal)',
    photoUrl:'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Miso soup \xb7 leek \xb7 wakame \xb7 silken tofu',
    description:'Light miso soup as a starter: broth with leek, rehydrated wakame and silken tofu. Miso is always added off the heat to preserve probiotics.',
    tags:['vegetarian','miso'], servings:'4\u20136 bowls', prepTime:'5 min', cookTime:'10 min',
    ingredients:['1.5L light vegetable stock (or dashi)','2 leeks, finely sliced','30g dried wakame','300g silken tofu, in 2 cm cubes','4 tablespoons white miso (shiro miso)','A few drops sesame oil (optional)','Spring onion or wild garlic, finely sliced'],
    instructions:['Rehydrate the wakame in a bowl of cold water for 5 min. Drain and cut into pieces if too long.','Bring stock to a gentle simmer (not a boil). Add sliced leeks. Cook 5 min.','Add rehydrated wakame and silken tofu cubes. Heat 2 min over very low heat.','Remove from heat. In a bowl, whisk white miso with a ladle of hot broth until fully dissolved. Pour into the pot and stir gently. Never boil after adding miso.','Serve immediately with a few drops of sesame oil and sliced spring onion or wild garlic.','For Sunday prep: make the base (stock + leeks + wakame) in large quantity. Store up to 4 days. Add tofu and miso just before serving.'] },

  { id:'salade-mache', category:'starter', color:'var(--teal)',
    photoUrl:'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400&h=200&q=75',
    name:"Lamb's lettuce \xb7 radishes \xb7 cider-mustard dressing",
    description:'Seasonal lamb\'s lettuce from late March, sliced pink radishes, toasted sunflower seeds, unfiltered apple cider vinegar and whole-grain mustard dressing.',
    tags:['vegetarian'], shelfLife:'first3', servings:'4 servings', prepTime:'10 min', cookTime:'3 min',
    ingredients:['200g fresh lamb\'s lettuce','1 bunch pink radishes, finely sliced','4 tablespoons sunflower seeds','3 tablespoons unfiltered apple cider vinegar','1 tablespoon whole-grain mustard','6 tablespoons olive oil','1 shallot, finely diced','Salt, pepper'],
    instructions:['Toast sunflower seeds dry in a pan for 3 min, stirring, until golden and fragrant. Leave to cool.','Make the dressing: in a bowl, mix apple cider vinegar, whole-grain mustard, diced shallot and a pinch of salt. Emulsify with olive oil, whisking.','Wash and dry the lamb\'s lettuce gently (it is delicate).','Dress the lamb\'s lettuce at the last moment to prevent wilting. Add radishes and sunflower seeds.','Serve immediately.'] },

  { id:'potage-carotte', category:'starter', color:'var(--teal)',
    photoUrl:'https://images.unsplash.com/photo-1476718406966-408be26d75aa?auto=format&fit=crop&w=400&h=200&q=75',
    name:'Carrot soup \xb7 fresh ginger \xb7 coconut milk \xb7 coriander',
    description:'Smooth soup prepared during Sunday meal prep with already-roasted carrots. Fresh ginger, coconut milk, fresh coriander. Keeps for 4 days.',
    tags:['vegetarian'], servings:'4\u20136 servings', prepTime:'5 min', cookTime:'20 min',
    ingredients:['6 roasted carrots (from Sunday prep)','1 piece fresh ginger (3\u20134 cm), grated','200ml coconut milk','700ml vegetable stock','1 lemon (juice)','1 tablespoon olive oil','Fresh coriander to serve','Salt, pepper'],
    instructions:['If done during meal prep: carrots are already roasted. Otherwise, roast 6 carrots with olive oil at 200\xb0C for 30 min.','Blend the roasted carrots with hot vegetable stock and grated ginger. Blend at length.','Add coconut milk. Blend again until very smooth.','Reheat gently if needed. Add lemon juice gradually, tasting. Adjust salt and pepper.','Serve with fresh coriander leaves and a drizzle of olive oil.','Keeps 4 days in the fridge. Reheat gently, adding a little stock if too thick.'] }
];

/**
 * Seed built-in recipes into localStorage on first load.
 * Preserves any existing user customisations (ratings, notes, saved state).
 */
function _seedBuiltIn() {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem('_seedV1')) return;
  var all = getAll();
  SEED_RECIPES.forEach(function(r) {
    var existing = all[r.id] || {};
    all[r.id] = Object.assign({}, r, {
      builtIn: true,
      saved: existing.saved !== undefined ? existing.saved : true,
      rating: existing.rating || 0,
      note: existing.note || '',
      hidden: existing.hidden || false
    });
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  localStorage.setItem('_seedV1', '1');
}

if (typeof window !== 'undefined') _seedBuiltIn();

// ── Export for Node.js (Jest) ──────────────────────────
if (typeof module !== 'undefined') {
  module.exports = { getAll, get, set, remove, getSaved, addCustomRecipe, updateCustomRecipe, searchSaved };
}
