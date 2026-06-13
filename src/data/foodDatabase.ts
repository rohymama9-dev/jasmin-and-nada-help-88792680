export interface FoodItem {
  nameAr: string;
  nameEn: string;
  serving: string; // descriptor e.g. "1 cup", "100g"
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
}

export const foodDatabase: FoodItem[] = [
  // Grains & Bread
  { nameAr: 'خبز أبيض (شريحة)', nameEn: 'White Bread (slice)', serving: '1 slice', calories: 80, protein: 3, carbs: 15, fat: 1 },
  { nameAr: 'خبز أسمر (شريحة)', nameEn: 'Whole Wheat Bread', serving: '1 slice', calories: 70, protein: 4, carbs: 12, fat: 1 },
  { nameAr: 'أرز أبيض (كوب)', nameEn: 'White Rice (cup)', serving: '1 cup', calories: 206, protein: 4, carbs: 45, fat: 0 },
  { nameAr: 'أرز بني (كوب)', nameEn: 'Brown Rice (cup)', serving: '1 cup', calories: 216, protein: 5, carbs: 45, fat: 2 },
  { nameAr: 'معكرونة (كوب)', nameEn: 'Pasta (cup)', serving: '1 cup', calories: 220, protein: 8, carbs: 43, fat: 1 },
  { nameAr: 'شوفان (كوب)', nameEn: 'Oatmeal (cup)', serving: '1 cup', calories: 154, protein: 6, carbs: 27, fat: 3 },
  { nameAr: 'كسكس (كوب)', nameEn: 'Couscous (cup)', serving: '1 cup', calories: 176, protein: 6, carbs: 36, fat: 0 },
  { nameAr: 'كينوا (كوب)', nameEn: 'Quinoa (cup)', serving: '1 cup', calories: 222, protein: 8, carbs: 39, fat: 4 },

  // Proteins - Meat & Poultry
  { nameAr: 'دجاج مشوي (100غ)', nameEn: 'Grilled Chicken (100g)', serving: '100g', calories: 165, protein: 31, carbs: 0, fat: 4 },
  { nameAr: 'صدر دجاج (100غ)', nameEn: 'Chicken Breast (100g)', serving: '100g', calories: 195, protein: 29, carbs: 0, fat: 8 },
  { nameAr: 'لحم بقري (100غ)', nameEn: 'Beef (100g)', serving: '100g', calories: 250, protein: 26, carbs: 0, fat: 17 },
  { nameAr: 'لحم ضأن (100غ)', nameEn: 'Lamb (100g)', serving: '100g', calories: 294, protein: 25, carbs: 0, fat: 21 },
  { nameAr: 'كبدة (100غ)', nameEn: 'Liver (100g)', serving: '100g', calories: 175, protein: 27, carbs: 4, fat: 5 },
  { nameAr: 'لحم مفروم (100غ)', nameEn: 'Ground Meat (100g)', serving: '100g', calories: 254, protein: 26, carbs: 0, fat: 17 },

  // Fish & Seafood
  { nameAr: 'سمك سلمون (100غ)', nameEn: 'Salmon (100g)', serving: '100g', calories: 208, protein: 22, carbs: 0, fat: 13 },
  { nameAr: 'سمك تونة (100غ)', nameEn: 'Tuna (100g)', serving: '100g', calories: 132, protein: 28, carbs: 0, fat: 1 },
  { nameAr: 'سمك بلطي (100غ)', nameEn: 'Tilapia (100g)', serving: '100g', calories: 128, protein: 26, carbs: 0, fat: 3 },
  { nameAr: 'جمبري (100غ)', nameEn: 'Shrimp (100g)', serving: '100g', calories: 99, protein: 24, carbs: 0, fat: 0 },

  // Eggs & Dairy
  { nameAr: 'بيضة مسلوقة', nameEn: 'Boiled Egg', serving: '1 egg', calories: 78, protein: 6, carbs: 1, fat: 5 },
  { nameAr: 'بيضة مقلية', nameEn: 'Fried Egg', serving: '1 egg', calories: 90, protein: 6, carbs: 0, fat: 7 },
  { nameAr: 'حليب كامل (كوب)', nameEn: 'Whole Milk (cup)', serving: '1 cup', calories: 150, protein: 8, carbs: 12, fat: 8 },
  { nameAr: 'حليب قليل الدسم', nameEn: 'Low-Fat Milk (cup)', serving: '1 cup', calories: 102, protein: 8, carbs: 12, fat: 2 },
  { nameAr: 'زبادي يوناني', nameEn: 'Greek Yogurt (cup)', serving: '1 cup', calories: 100, protein: 17, carbs: 6, fat: 0 },
  { nameAr: 'زبادي عادي', nameEn: 'Plain Yogurt (cup)', serving: '1 cup', calories: 149, protein: 9, carbs: 11, fat: 8 },
  { nameAr: 'جبنة بيضاء (30غ)', nameEn: 'White Cheese (30g)', serving: '30g', calories: 80, protein: 6, carbs: 1, fat: 6 },
  { nameAr: 'جبنة شيدر (30غ)', nameEn: 'Cheddar (30g)', serving: '30g', calories: 113, protein: 7, carbs: 0, fat: 9 },
  { nameAr: 'لبنة (ملعقة)', nameEn: 'Labneh (tbsp)', serving: '1 tbsp', calories: 60, protein: 3, carbs: 2, fat: 5 },

  // Legumes
  { nameAr: 'فول (كوب)', nameEn: 'Fava Beans (cup)', serving: '1 cup', calories: 187, protein: 13, carbs: 33, fat: 1 },
  { nameAr: 'حمص (كوب)', nameEn: 'Chickpeas (cup)', serving: '1 cup', calories: 269, protein: 15, carbs: 45, fat: 4 },
  { nameAr: 'عدس (كوب)', nameEn: 'Lentils (cup)', serving: '1 cup', calories: 230, protein: 18, carbs: 40, fat: 1 },
  { nameAr: 'فاصوليا بيضاء', nameEn: 'White Beans (cup)', serving: '1 cup', calories: 249, protein: 17, carbs: 45, fat: 1 },

  // Vegetables
  { nameAr: 'سلطة خضراء', nameEn: 'Green Salad', serving: '1 bowl', calories: 35, protein: 2, carbs: 7, fat: 0 },
  { nameAr: 'طماطم', nameEn: 'Tomato', serving: '1 medium', calories: 22, protein: 1, carbs: 5, fat: 0 },
  { nameAr: 'خيار', nameEn: 'Cucumber', serving: '1 medium', calories: 16, protein: 1, carbs: 4, fat: 0 },
  { nameAr: 'بطاطس مشوية', nameEn: 'Baked Potato', serving: '1 medium', calories: 161, protein: 4, carbs: 37, fat: 0 },
  { nameAr: 'بطاطس مقلية', nameEn: 'French Fries', serving: '100g', calories: 312, protein: 3, carbs: 41, fat: 15 },
  { nameAr: 'بطاطا حلوة', nameEn: 'Sweet Potato', serving: '1 medium', calories: 112, protein: 2, carbs: 26, fat: 0 },
  { nameAr: 'بروكلي مطبوخ', nameEn: 'Broccoli (cup)', serving: '1 cup', calories: 55, protein: 4, carbs: 11, fat: 1 },
  { nameAr: 'سبانخ مطبوخة', nameEn: 'Spinach (cup)', serving: '1 cup', calories: 41, protein: 5, carbs: 7, fat: 0 },
  { nameAr: 'جزر', nameEn: 'Carrot', serving: '1 medium', calories: 25, protein: 1, carbs: 6, fat: 0 },

  // Fruits
  { nameAr: 'تفاحة', nameEn: 'Apple', serving: '1 medium', calories: 95, protein: 0, carbs: 25, fat: 0 },
  { nameAr: 'موزة', nameEn: 'Banana', serving: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { nameAr: 'برتقالة', nameEn: 'Orange', serving: '1 medium', calories: 62, protein: 1, carbs: 15, fat: 0 },
  { nameAr: 'عنب (كوب)', nameEn: 'Grapes (cup)', serving: '1 cup', calories: 104, protein: 1, carbs: 27, fat: 0 },
  { nameAr: 'فراولة (كوب)', nameEn: 'Strawberries (cup)', serving: '1 cup', calories: 49, protein: 1, carbs: 12, fat: 0 },
  { nameAr: 'مانجو', nameEn: 'Mango', serving: '1 medium', calories: 150, protein: 1, carbs: 35, fat: 1 },
  { nameAr: 'تمر (3 حبات)', nameEn: 'Dates (3 pcs)', serving: '3 pcs', calories: 70, protein: 1, carbs: 18, fat: 0 },
  { nameAr: 'أفوكادو', nameEn: 'Avocado', serving: '1/2 fruit', calories: 160, protein: 2, carbs: 9, fat: 15 },

  // Nuts & Seeds
  { nameAr: 'لوز (28غ)', nameEn: 'Almonds (28g)', serving: '28g', calories: 164, protein: 6, carbs: 6, fat: 14 },
  { nameAr: 'جوز (28غ)', nameEn: 'Walnuts (28g)', serving: '28g', calories: 185, protein: 4, carbs: 4, fat: 18 },
  { nameAr: 'فستق (28غ)', nameEn: 'Pistachios (28g)', serving: '28g', calories: 159, protein: 6, carbs: 8, fat: 13 },
  { nameAr: 'زبدة فول سوداني', nameEn: 'Peanut Butter (tbsp)', serving: '1 tbsp', calories: 94, protein: 4, carbs: 3, fat: 8 },

  // Drinks
  { nameAr: 'عصير برتقال', nameEn: 'Orange Juice (cup)', serving: '1 cup', calories: 112, protein: 2, carbs: 26, fat: 0 },
  { nameAr: 'شاي بسكر', nameEn: 'Tea w/ Sugar', serving: '1 cup', calories: 30, protein: 0, carbs: 8, fat: 0 },
  { nameAr: 'قهوة بحليب', nameEn: 'Coffee w/ Milk', serving: '1 cup', calories: 60, protein: 3, carbs: 6, fat: 3 },
  { nameAr: 'كابتشينو', nameEn: 'Cappuccino', serving: '1 cup', calories: 80, protein: 4, carbs: 8, fat: 4 },

  // Common dishes / Snacks
  { nameAr: 'بيتزا (شريحة)', nameEn: 'Pizza (slice)', serving: '1 slice', calories: 285, protein: 12, carbs: 36, fat: 10 },
  { nameAr: 'برغر', nameEn: 'Burger', serving: '1 burger', calories: 354, protein: 17, carbs: 29, fat: 17 },
  { nameAr: 'شاورما دجاج', nameEn: 'Chicken Shawarma', serving: '1 wrap', calories: 430, protein: 28, carbs: 35, fat: 19 },
  { nameAr: 'فلافل (3 قطع)', nameEn: 'Falafel (3 pcs)', serving: '3 pcs', calories: 200, protein: 8, carbs: 18, fat: 11 },
  { nameAr: 'كنافة (قطعة)', nameEn: 'Kunafa (piece)', serving: '1 piece', calories: 320, protein: 5, carbs: 38, fat: 17 },
  { nameAr: 'بسكويت (قطعة)', nameEn: 'Cookie (piece)', serving: '1 piece', calories: 78, protein: 1, carbs: 10, fat: 4 },
  { nameAr: 'شوكولاتة (30غ)', nameEn: 'Chocolate (30g)', serving: '30g', calories: 155, protein: 2, carbs: 17, fat: 9 },
  { nameAr: 'آيس كريم', nameEn: 'Ice Cream (scoop)', serving: '1 scoop', calories: 137, protein: 2, carbs: 16, fat: 7 },
];
