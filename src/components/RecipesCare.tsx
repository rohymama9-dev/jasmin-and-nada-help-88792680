import { useState } from 'react';
import { UtensilsCrossed, ArrowLeft, ArrowRight, Clock, Heart, Sparkles } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

type Category = 'recipes' | 'skincare' | 'haircare' | 'cooking';

interface Item {
  id: string; category: Category; titleAr: string; titleEn: string; descAr: string; descEn: string;
  ingredientsAr: string[]; ingredientsEn: string[]; stepsAr: string[]; stepsEn: string[]; time: string; emoji: string;
}

const items: Item[] = [
  { id: '1', category: 'recipes', emoji: '🥤', titleAr: 'سموذي الفراولة', titleEn: 'Strawberry Smoothie', descAr: 'مشروب صحي', descEn: 'Healthy drink',
    ingredientsAr: ['كوب فراولة', 'موزة', 'نصف كوب زبادي', 'ملعقة عسل'], ingredientsEn: ['1 cup strawberries', '1 banana', '½ cup yogurt', '1 tbsp honey'],
    stepsAr: ['ضعي المكونات في الخلاط', 'اخلطي لمدة دقيقة', 'صبي في كوب'], stepsEn: ['Put ingredients in blender', 'Blend 1 minute', 'Pour and serve'], time: '5' },
  { id: '2', category: 'recipes', emoji: '🥞', titleAr: 'بان كيك الشوفان', titleEn: 'Oat Pancakes', descAr: 'فطور صحي', descEn: 'Healthy breakfast',
    ingredientsAr: ['كوب شوفان', 'بيضة', 'نصف كوب حليب', 'عسل'], ingredientsEn: ['1 cup oats', '1 egg', '½ cup milk', 'honey'],
    stepsAr: ['اخلطي المكونات', 'سخني مقلاة', 'اطهيها من الجانبين'], stepsEn: ['Mix ingredients', 'Heat pan', 'Cook both sides'], time: '15' },
  { id: '3', category: 'skincare', emoji: '✨', titleAr: 'ماسك العسل', titleEn: 'Honey Face Mask', descAr: 'لبشرة نضرة', descEn: 'For glowing skin',
    ingredientsAr: ['ملعقتان عسل', 'عصير ليمون', 'ملعقة زبادي'], ingredientsEn: ['2 tbsp honey', 'Lemon juice', '1 tbsp yogurt'],
    stepsAr: ['اخلطي المكونات', 'وزعي على الوجه 15 دقيقة', 'اغسلي بالماء'], stepsEn: ['Mix well', 'Apply 15 min', 'Rinse'], time: '20' },
  { id: '4', category: 'haircare', emoji: '💆‍♀️', titleAr: 'زيت جوز الهند', titleEn: 'Coconut Oil Treatment', descAr: 'للشعر الجاف', descEn: 'For dry hair',
    ingredientsAr: ['3 ملاعق زيت جوز هند', 'ملعقة زيت زيتون', 'ملعقة عسل'], ingredientsEn: ['3 tbsp coconut oil', '1 tbsp olive oil', '1 tbsp honey'],
    stepsAr: ['سخني الزيوت', 'وزعيها على الشعر', 'اتركيه ساعة ثم اغسلي'], stepsEn: ['Warm oils', 'Apply to hair', 'Leave 1hr, wash'], time: '60' },
  { id: '5', category: 'cooking', emoji: '🍗', titleAr: 'دجاج مشوي بالأعشاب', titleEn: 'Herb Grilled Chicken', descAr: 'وجبة رئيسية لذيذة', descEn: 'Delicious main dish',
    ingredientsAr: ['صدور دجاج', 'زعتر وإكليل الجبل', 'ليمون', 'ثوم', 'زيت زيتون', 'ملح وفلفل'], ingredientsEn: ['Chicken breast', 'Thyme & rosemary', 'Lemon', 'Garlic', 'Olive oil', 'Salt & pepper'],
    stepsAr: ['تبلي الدجاج بالأعشاب والليمون والثوم', 'اتركيه ساعة في الثلاجة', 'اشويه 20 دقيقة لكل جانب', 'قدميه مع الأرز أو السلطة'], stepsEn: ['Season chicken with herbs, lemon, garlic', 'Refrigerate for 1 hour', 'Grill 20 min per side', 'Serve with rice or salad'], time: '60' },
  { id: '6', category: 'cooking', emoji: '🍝', titleAr: 'معكرونة بصلصة البندورة', titleEn: 'Pasta with Tomato Sauce', descAr: 'وجبة سهلة وسريعة', descEn: 'Quick easy meal',
    ingredientsAr: ['معكرونة', 'طماطم طازجة', 'ريحان', 'ثوم', 'زيت زيتون', 'جبنة بارميزان'], ingredientsEn: ['Pasta', 'Fresh tomatoes', 'Basil', 'Garlic', 'Olive oil', 'Parmesan'],
    stepsAr: ['اسلقي المعكرونة', 'حمّري الثوم في الزيت', 'أضيفي الطماطم المقطعة', 'اخلطي مع المعكرونة وزيّني بالريحان'], stepsEn: ['Boil pasta', 'Sauté garlic in oil', 'Add diced tomatoes', 'Toss with pasta and garnish with basil'], time: '25' },
  { id: '7', category: 'cooking', emoji: '🥗', titleAr: 'سلطة الكينوا', titleEn: 'Quinoa Salad', descAr: 'صحية ومغذية', descEn: 'Healthy & nutritious',
    ingredientsAr: ['كوب كينوا', 'خيار', 'طماطم', 'بقدونس', 'ليمون', 'زيت زيتون'], ingredientsEn: ['1 cup quinoa', 'Cucumber', 'Tomatoes', 'Parsley', 'Lemon', 'Olive oil'],
    stepsAr: ['اطبخي الكينوا واتركيها تبرد', 'قطعي الخضروات', 'اخلطي الكل مع الليمون والزيت'], stepsEn: ['Cook quinoa and let cool', 'Chop vegetables', 'Mix with lemon and oil'], time: '20' },
  { id: '8', category: 'cooking', emoji: '🍰', titleAr: 'كيكة الشوكولاتة السهلة', titleEn: 'Easy Chocolate Cake', descAr: 'حلوى لذيذة', descEn: 'Delicious dessert',
    ingredientsAr: ['2 كوب دقيق', 'كوب سكر', 'نصف كوب كاكاو', '3 بيضات', 'كوب حليب', 'نصف كوب زيت'], ingredientsEn: ['2 cups flour', '1 cup sugar', '½ cup cocoa', '3 eggs', '1 cup milk', '½ cup oil'],
    stepsAr: ['اخلطي المكونات الجافة', 'أضيفي البيض والحليب والزيت', 'اخبزيها 35 دقيقة على 180°'], stepsEn: ['Mix dry ingredients', 'Add eggs, milk, oil', 'Bake 35 min at 180°C'], time: '50' },
  { id: '9', category: 'cooking', emoji: '🥙', titleAr: 'فلافل مقرمشة', titleEn: 'Crispy Falafel', descAr: 'وجبة عربية كلاسيكية', descEn: 'Classic Middle Eastern',
    ingredientsAr: ['حمص منقوع', 'بقدونس وكزبرة', 'بصل', 'ثوم', 'كمون', 'بيكنج بودر'], ingredientsEn: ['Soaked chickpeas', 'Parsley & cilantro', 'Onion', 'Garlic', 'Cumin', 'Baking powder'],
    stepsAr: ['اطحني الحمص مع الأعشاب', 'شكّلي كرات صغيرة', 'اقليها في زيت ساخن حتى تذهب'], stepsEn: ['Grind chickpeas with herbs', 'Form small balls', 'Deep fry until golden'], time: '40' },
  { id: '10', category: 'cooking', emoji: '🍲', titleAr: 'شوربة عدس', titleEn: 'Lentil Soup', descAr: 'دافئة ومغذية', descEn: 'Warm & nutritious',
    ingredientsAr: ['كوب عدس أحمر', 'بصل', 'جزر', 'كمون', 'ليمون', 'مرق دجاج'], ingredientsEn: ['1 cup red lentils', 'Onion', 'Carrot', 'Cumin', 'Lemon', 'Chicken broth'],
    stepsAr: ['حمّري البصل والجزر', 'أضيفي العدس والمرق', 'اطبخي 20 دقيقة ثم اخلطي بالخلاط'], stepsEn: ['Sauté onion and carrot', 'Add lentils and broth', 'Cook 20 min then blend'], time: '30' },
  { id: '11', category: 'skincare', emoji: '🥑', titleAr: 'ماسك الأفوكادو', titleEn: 'Avocado Face Mask', descAr: 'ترطيب عميق', descEn: 'Deep moisturizing',
    ingredientsAr: ['نصف أفوكادو', 'ملعقة عسل', 'ملعقة زبادي'], ingredientsEn: ['½ avocado', '1 tbsp honey', '1 tbsp yogurt'],
    stepsAr: ['اهرسي الأفوكادو', 'اخلطي مع العسل والزبادي', 'طبقي 20 دقيقة ثم اغسلي'], stepsEn: ['Mash avocado', 'Mix with honey and yogurt', 'Apply 20 min then rinse'], time: '25' },
  { id: '12', category: 'skincare', emoji: '☕', titleAr: 'سكراب القهوة', titleEn: 'Coffee Scrub', descAr: 'تقشير طبيعي', descEn: 'Natural exfoliation',
    ingredientsAr: ['3 ملاعق بن مطحون', 'ملعقة زيت جوز هند', 'ملعقة سكر بني'], ingredientsEn: ['3 tbsp ground coffee', '1 tbsp coconut oil', '1 tbsp brown sugar'],
    stepsAr: ['اخلطي المكونات', 'دلكي البشرة بحركات دائرية', 'اغسلي بالماء الدافئ'], stepsEn: ['Mix ingredients', 'Massage skin in circles', 'Rinse with warm water'], time: '10' },
  { id: '13', category: 'haircare', emoji: '🥚', titleAr: 'ماسك البيض للشعر', titleEn: 'Egg Hair Mask', descAr: 'لتقوية الشعر', descEn: 'For stronger hair',
    ingredientsAr: ['2 بيضة', 'ملعقة زيت زيتون', 'ملعقة عسل'], ingredientsEn: ['2 eggs', '1 tbsp olive oil', '1 tbsp honey'],
    stepsAr: ['اخفقي البيض', 'أضيفي الزيت والعسل', 'طبقي على الشعر 30 دقيقة ثم اغسلي بماء بارد'], stepsEn: ['Whisk eggs', 'Add oil and honey', 'Apply 30 min then wash with cold water'], time: '35' },
  { id: '14', category: 'cooking', emoji: '🥘', titleAr: 'كبسة دجاج', titleEn: 'Chicken Kabsa', descAr: 'طبق سعودي تقليدي', descEn: 'Traditional Saudi dish',
    ingredientsAr: ['دجاج كامل', '3 أكواب أرز بسمتي', 'بصل وطماطم', 'بهارات كبسة', 'ليمون أسود'], ingredientsEn: ['Whole chicken', '3 cups basmati rice', 'Onion & tomato', 'Kabsa spice mix', 'Dried lime'],
    stepsAr: ['حمّري البصل ثم أضيفي الدجاج', 'أضيفي البهارات والطماطم', 'أضيفي الأرز والماء واتركيه على نار هادئة 25 دقيقة'], stepsEn: ['Sauté onion then add chicken', 'Add spices and tomato', 'Add rice and water, simmer 25 min'], time: '60' },
  { id: '15', category: 'cooking', emoji: '🧁', titleAr: 'كب كيك الفانيلا', titleEn: 'Vanilla Cupcakes', descAr: 'حلوى للأطفال', descEn: 'Kids dessert',
    ingredientsAr: ['كوب ونصف دقيق', 'كوب سكر', '2 بيضة', 'فانيلا', 'نصف كوب زبدة', 'كريمة للتزيين'], ingredientsEn: ['1.5 cups flour', '1 cup sugar', '2 eggs', 'Vanilla', '½ cup butter', 'Frosting'],
    stepsAr: ['اخلطي الزبدة والسكر', 'أضيفي البيض والفانيلا', 'أضيفي الدقيق واخبزي 20 دقيقة', 'زيّني بالكريمة'], stepsEn: ['Cream butter and sugar', 'Add eggs and vanilla', 'Add flour, bake 20 min', 'Decorate with frosting'], time: '35' },
  { id: '16', category: 'recipes', emoji: '🍋', titleAr: 'عصير ليمون بالنعناع', titleEn: 'Lemon Mint Juice', descAr: 'منعش ولذيذ', descEn: 'Refreshing & delicious',
    ingredientsAr: ['3 ليمونات', 'حفنة نعناع طازج', '4 أكواب ماء بارد', 'نصف كوب سكر'], ingredientsEn: ['3 lemons', 'Handful of fresh mint', '4 cups cold water', '½ cup sugar'],
    stepsAr: ['قشري الليمون وأزيلي البذور', 'ضعي الكل في الخلاط', 'صفّيه وقدميه مع الثلج'], stepsEn: ['Peel lemons and remove seeds', 'Blend all ingredients', 'Strain and serve with ice'], time: '10' },
  { id: '17', category: 'skincare', emoji: '🥒', titleAr: 'ماسك الخيار للعين', titleEn: 'Cucumber Eye Mask', descAr: 'للهالات السوداء', descEn: 'For dark circles',
    ingredientsAr: ['شرائح خيار باردة', 'قطن', 'ماء ورد'], ingredientsEn: ['Cold cucumber slices', 'Cotton pads', 'Rose water'],
    stepsAr: ['ضعي شرائح الخيار على العين', 'بللي القطن بماء الورد وضعه فوقها', 'استرخي لمدة 15 دقيقة'], stepsEn: ['Place cucumber on eyes', 'Dampen pads with rose water and place over', 'Relax for 15 min'], time: '15' },
  { id: '18', category: 'cooking', emoji: '🍕', titleAr: 'بيتزا منزلية سريعة', titleEn: 'Quick Homemade Pizza', descAr: 'وجبة مفضلة للجميع', descEn: 'Everyone\'s favorite',
    ingredientsAr: ['عجينة بيتزا جاهزة', 'صلصة طماطم', 'جبنة موزاريلا', 'زيتون وفلفل'], ingredientsEn: ['Ready pizza dough', 'Tomato sauce', 'Mozzarella cheese', 'Olives & peppers'],
    stepsAr: ['افردي العجينة وضعي الصلصة', 'وزعي الجبنة والخضروات', 'اخبزيها في فرن ساخن 15 دقيقة'], stepsEn: ['Spread dough and sauce', 'Add cheese and veggies', 'Bake in hot oven for 15 min'], time: '20' },
];

const cats: { key: Category; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
  { key: 'cooking', labelAr: 'طبخ', labelEn: 'Cooking', icon: UtensilsCrossed },
  { key: 'recipes', labelAr: 'مشروبات', labelEn: 'Drinks', icon: Heart },
  { key: 'skincare', labelAr: 'بشرة', labelEn: 'Skincare', icon: Sparkles },
  { key: 'haircare', labelAr: 'شعر', labelEn: 'Hair', icon: Heart },
];

const RecipesCare = () => {
  const { lang, dir } = useLang();
  const [category, setCategory] = useState<Category>('cooking');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const filtered = items.filter(i => i.category === category);

  if (selectedItem) {
    return (
      <div className="pb-4 space-y-4">
        <button onClick={() => setSelectedItem(null)} className="flex items-center gap-2 text-primary"><BackArrow size={18} /><span className="text-sm font-medium">{lang === 'ar' ? 'رجوع' : 'Back'}</span></button>
        <div className="text-center"><span className="text-4xl">{selectedItem.emoji}</span><h2 className="text-xl font-bold text-foreground mt-2">{lang === 'ar' ? selectedItem.titleAr : selectedItem.titleEn}</h2>
          <span className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><Clock size={12} /> {selectedItem.time} {lang === 'ar' ? 'دقيقة' : 'min'}</span></div>
        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-bold text-foreground mb-2">{lang === 'ar' ? 'المكونات' : 'Ingredients'}</h3>
          <ul className="space-y-1.5">{(lang === 'ar' ? selectedItem.ingredientsAr : selectedItem.ingredientsEn).map((ing, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-primary" />{ing}</li>))}</ul>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-bold text-foreground mb-2">{lang === 'ar' ? 'الخطوات' : 'Steps'}</h3>
          <div className="space-y-3">{(lang === 'ar' ? selectedItem.stepsAr : selectedItem.stepsEn).map((step, i) => (
            <div key={i} className="flex items-start gap-3"><div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0"><span className="text-primary-foreground text-xs font-bold">{i+1}</span></div>
              <p className="text-sm text-foreground leading-relaxed">{step}</p></div>))}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">{cats.map(cat => {
        const Icon = cat.icon;
        return (<button key={cat.key} onClick={() => setCategory(cat.key)}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${category === cat.key ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          <Icon size={14} />{lang === 'ar' ? cat.labelAr : cat.labelEn}</button>);
      })}</div>
      <div className="space-y-2">{filtered.map(item => (
        <button key={item.id} onClick={() => setSelectedItem(item)}
          className="w-full glass-card rounded-2xl p-4 text-start flex items-center gap-4 hover:bg-primary/5 transition-all active:scale-[0.98]">
          <span className="text-3xl">{item.emoji}</span>
          <div className="flex-1"><p className="font-semibold text-foreground text-sm">{lang === 'ar' ? item.titleAr : item.titleEn}</p>
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? item.descAr : item.descEn}</p></div>
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} />{item.time}{lang === 'ar' ? 'د' : 'm'}</span>
        </button>))}</div>
    </div>
  );
};

export default RecipesCare;
