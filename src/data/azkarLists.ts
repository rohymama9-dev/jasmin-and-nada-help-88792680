import azkarData from './azkar.json';

export interface AzkarItem {
  id: string;
  textAr: string;
  textEn: string;
  target: number;
  time: 'morning' | 'evening' | 'travel';
}

type JsonAzkar = any;

const englishSections: JsonAzkar[] = (azkarData as any).English || [];
const morningEveningSection = englishSections.find(section => section.ID === 27)?.TEXT || [];
const travelSection = englishSections.find(section => section.ID === 96)?.TEXT || [];

const buildSurahItems = (prefix: string, time: 'morning' | 'evening'): AzkarItem[] => [
  {
    id: `${prefix}-76-ikhlas`,
    textAr: 'بسم الله الرحمن الرحيم ﴿قُلْ هُوَ اللَّهُ أَحَدٌ* اللَّهُ الصَّمَدُ* لَمْ يَلِدْ وَلَمْ يُولَدْ* وَلَمْ يَكُن لَّهُ كُفُواً أَحَدٌ﴾.',
    textEn: '[Surah Al-Ikhlas (112)] Say, He is Allah, [who is] One, Allah, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent.',
    target: 3,
    time
  },
  {
    id: `${prefix}-76-falaq`,
    textAr: 'بسم الله الرحمن الرحيم ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ* مِن شَرِّ مَا خَلَقَ* وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ* وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ* وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ﴾.',
    textEn: '[Surah Al-Falaq (113)] Say, I seek refuge in the Lord of daybreak, From the evil of that which He created, And from the evil of darkness when it settles, And from the evil of the blowers in knots, And from the evil of an envier when he envies.',
    target: 3,
    time
  },
  {
    id: `${prefix}-76-nas`,
    textAr: 'بسم الله الرحمن الرحيم ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ* مَلِكِ النَّاسِ* إِلَهِ النَّاسِ* مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ* الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ* مِنَ الْجِنَّةِ وَالنَّاسِ﴾.',
    textEn: '[Surah An-Nas (114)] Say, I seek refuge in the Lord of mankind, The Sovereign of mankind, The God of mankind, From the evil of the retreating whisperer - Who whispers [evil] into the breasts of mankind - From among the jinn and mankind.',
    target: 3,
    time
  }
];

const cleanMorningText = (original: string): string => {
  return original
    .replace(/إذا أمسى/g, '')
    .replace(/أَمْسَى/g, 'أَصْبَحَ')
    .replace(/أَمْسَيْنَا/g, 'أَصْبَحْنَا')
    .replace(/أَمْسَيْتُ/g, 'أَصْبَحْتُ')
    .replace(/أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ/g, 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ')
    .replace(/أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ/g, 'أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ')
    .replace(/خَيْرَ هَذِهِ اللَّيْلَةِ/giu, 'خَيْرَ هَذَا الْيَوْمِ')
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanEveningText = (original: string): string => {
  return original
    .replace(/أَصْبَحْتُ/g, 'أَمْسَيْتُ')
    .replace(/أَصْبَحْنَا/g, 'أَمْسَيْنَا')
    .replace(/أَصْبَحَ/g, 'أَمْسَى')
    .replace(/خَيْرَ هَذَا الْيَوْمِ/giu, 'خَيْرَ هَذِهِ اللَّيْلَةِ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildMorningItem = (item: JsonAzkar): AzkarItem | AzkarItem[] => {
  if (item.ID === 76) {
    return buildSurahItems('m', 'morning');
  }

  if (item.ID === 77) {
    return {
      id: 'm-77',
      textAr:
        '((أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ، وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ، وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ)).',
      textEn:
        'We have reached the morning and at this very time unto Allaah belongs all sovereignty, and all praise is for Allaah. None has the right to be worshipped except Allaah, alone, without any partner, to Him belong all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this day and the good of what follows it and I take refuge in You from the evil of this day and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.',
      target: item.REPEAT || 1,
      time: 'morning'
    };
  }

  if (item.ID === 78) {
    return {
      id: 'm-78',
      textAr: '((اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ)).',
      textEn: '(O Allah, by Your leave we have reached the morning, by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection.)',
      target: item.REPEAT || 1,
      time: 'morning'
    };
  }

  if (item.ID === 80) {
    return {
      id: 'm-80',
      textAr: '((اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلاَئِكَتِكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلاَّ أَنْتَ وَحْدَهُ لاَ شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ)) (أربعَ مَرَّاتٍ).',
      textEn: '(O Allah, verily I have reached the morning and call on You, the bearers of Your throne, Your angels, and all of Your creation to witness that You are Allah, none has the right to be worshipped except You, alone, without partner and that Muhammad is Your Servant and Messenger.) (four times in the morning)',
      target: item.REPEAT || 1,
      time: 'morning'
    };
  }

  if (item.ID === 81) {
    return {
      id: 'm-81',
      textAr: '((اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لاَ شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ)).',
      textEn: '(O Allah, whatever blessing I or any of Your creation has reached in the morning is from You alone, without partner, so for You is all praise and to You is all thanks.)',
      target: item.REPEAT || 1,
      time: 'morning'
    };
  }

  if (item.ID === 89) {
    return {
      id: 'm-89',
      textAr: '((أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ)).',
      textEn: '(We have reached the morning upon the Islamic faith, and upon the word of sincerity, and upon the religion of our Prophet Muhammad (PBUH).)',
      target: item.REPEAT || 1,
      time: 'morning'
    };
  }

  if (item.ID === 90) {
    return {
      id: 'm-90',
      textAr: '((أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ، فَتْحَهُ، وَنَصْرَهُ، وَنُورَهُ، وَبَرَكَتَهُ، وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ)).',
      textEn: '(We have reached the morning and the kingdom belongs to Allaah, the Lord of the Worlds. O Allaah, I ask You for the good of this day, its opening, its victory, its light and its blessings and its guidance, and I take refuge in You from the evil of what is in it and the evil of what follows it.)',
      target: item.REPEAT || 1,
      time: 'morning'
    };
  }

  const arText = cleanMorningText(item.ARABIC_TEXT || '');
  const enText = (item.TRANSLATED_TEXT || '').replace(/evening/gi, 'morning').replace(/night/gi, 'day');

  return {
    id: `m-${item.ID}`,
    textAr: arText,
    textEn: enText,
    target: item.REPEAT || 1,
    time: 'morning'
  };
};

const buildEveningItem = (item: JsonAzkar): AzkarItem | AzkarItem[] => {
  if (item.ID === 76) {
    return buildSurahItems('e', 'evening');
  }

  if (item.ID === 77) {
    return {
      id: 'e-77',
      textAr:
        '((أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ هَذِهِ اللَّيْلَةِ، وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ، وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ)).',
      textEn:
        'We have reached the evening and at this very time unto Allaah belongs all sovereignty, and all praise is for Allaah. None has the right to be worshipped except Allaah, alone, without any partner, to Him belong all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this night and the good of what follows it and I take refuge in You from the evil of this night and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.)',
      target: item.REPEAT || 1,
      time: 'evening'
    };
  }

  if (item.ID === 78) {
    return {
      id: 'e-78',
      textAr: 'اللَّهم بك أمسينا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك المصير.',
      textEn: '(O Allah, by Your leave we have reached the evening, by Your leave we have reached the evening, by Your leave we live and die and unto You is our return.)',
      target: item.REPEAT || 1,
      time: 'evening'
    };
  }

  if (item.ID === 80) {
    return {
      id: 'e-80',
      textAr: '((اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلاَئِكَتِكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلاَّ أَنْتَ وَحْدَهُ لاَ شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ)) (أربعَ مَرَّاتٍ).',
      textEn: '(O Allah, verily I have reached the evening and call on You, the bearers of Your throne, Your angels, and all of Your creation to witness that You are Allah, none has the right to be worshipped except You, alone, without partner and that Muhammad is Your Servant and Messenger.) (four times in the evening)',
      target: item.REPEAT || 1,
      time: 'evening'
    };
  }

  if (item.ID === 81) {
    return {
      id: 'e-81',
      textAr: '((اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لاَ شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ)).',
      textEn: '(O Allah, whatever blessing I or any of Your creation has reached in the evening is from You alone, without partner, so for You is all praise and to You is all thanks.)',
      target: item.REPEAT || 1,
      time: 'evening'
    };
  }

  if (item.ID === 89) {
    return {
      id: 'e-89',
      textAr: '((أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ)).',
      textEn: '(We have reached the evening upon the Islamic faith, and upon the word of sincerity, and upon the religion of our Prophet Muhammad (PBUH).)',
      target: item.REPEAT || 1,
      time: 'evening'
    };
  }

  if (item.ID === 90) {
    return {
      id: 'e-90',
      textAr: '((أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذِهِ اللَّيْلَةِ، فَتْحَهَا، وَنَصْرَهَا، وَنُورَهَا، وَبَرَكَتَهَا، وَهُدَاهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهَا وَشَرِّ مَا بَعْدَهَا)).',
      textEn: '(We have reached the evening and the kingdom belongs to Allaah, the Lord of the Worlds. O Allaah, I ask You for the good of this night, its opening, its victory, its light and its blessings and its guidance, and I take refuge in You from the evil of what is in it and the evil of what follows it.)',
      target: item.REPEAT || 1,
      time: 'evening'
    };
  }

  const arText = cleanEveningText(item.ARABIC_TEXT || '');
  const enText = (item.TRANSLATED_TEXT || '').replace(/morning/gi, 'evening').replace(/day/gi, 'night');

  return {
    id: `e-${item.ID}`,
    textAr: arText,
    textEn: enText,
    target: item.REPEAT || 1,
    time: 'evening'
  };
};

const buildItem = (item: JsonAzkar, builder: (item: JsonAzkar) => AzkarItem | AzkarItem[]) => {
  const result = builder(item);
  return Array.isArray(result) ? result : [result];
};

export const morningAzkar: AzkarItem[] = morningEveningSection.flatMap((item: JsonAzkar) => buildItem(item, buildMorningItem));
export const eveningAzkar: AzkarItem[] = morningEveningSection.flatMap((item: JsonAzkar) => buildItem(item, buildEveningItem));
export const travelAzkar: AzkarItem[] = travelSection.map((item: any) => ({
  id: `t-${item.ID}`,
  textAr: item.ARABIC_TEXT,
  textEn: item.TRANSLATED_TEXT,
  target: item.REPEAT || 1,
  time: 'travel'
}));
