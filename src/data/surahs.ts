export interface Surah {
  number: number;
  nameAr: string;
  nameEn: string;
  versesCount: number;
  type: 'meccan' | 'medinan';
}

export const surahs: Surah[] = [
  { number: 1, nameAr: 'الفاتحة', nameEn: 'Al-Fatiha', versesCount: 7, type: 'meccan' },
  { number: 2, nameAr: 'البقرة', nameEn: 'Al-Baqarah', versesCount: 286, type: 'medinan' },
  { number: 3, nameAr: 'آل عمران', nameEn: 'Ali Imran', versesCount: 200, type: 'medinan' },
  { number: 4, nameAr: 'النساء', nameEn: 'An-Nisa', versesCount: 176, type: 'medinan' },
  { number: 5, nameAr: 'المائدة', nameEn: 'Al-Maida', versesCount: 120, type: 'medinan' },
  { number: 6, nameAr: 'الأنعام', nameEn: 'Al-Anam', versesCount: 165, type: 'meccan' },
  { number: 7, nameAr: 'الأعراف', nameEn: 'Al-Araf', versesCount: 206, type: 'meccan' },
  { number: 8, nameAr: 'الأنفال', nameEn: 'Al-Anfal', versesCount: 75, type: 'medinan' },
  { number: 9, nameAr: 'التوبة', nameEn: 'At-Tawbah', versesCount: 129, type: 'medinan' },
  { number: 10, nameAr: 'يونس', nameEn: 'Yunus', versesCount: 109, type: 'meccan' },
  { number: 11, nameAr: 'هود', nameEn: 'Hud', versesCount: 123, type: 'meccan' },
  { number: 12, nameAr: 'يوسف', nameEn: 'Yusuf', versesCount: 111, type: 'meccan' },
  { number: 18, nameAr: 'الكهف', nameEn: 'Al-Kahf', versesCount: 110, type: 'meccan' },
  { number: 19, nameAr: 'مريم', nameEn: 'Maryam', versesCount: 98, type: 'meccan' },
  { number: 36, nameAr: 'يس', nameEn: 'Ya-Sin', versesCount: 83, type: 'meccan' },
  { number: 55, nameAr: 'الرحمن', nameEn: 'Ar-Rahman', versesCount: 78, type: 'medinan' },
  { number: 56, nameAr: 'الواقعة', nameEn: 'Al-Waqia', versesCount: 96, type: 'meccan' },
  { number: 67, nameAr: 'الملك', nameEn: 'Al-Mulk', versesCount: 30, type: 'meccan' },
  { number: 112, nameAr: 'الإخلاص', nameEn: 'Al-Ikhlas', versesCount: 4, type: 'meccan' },
  { number: 113, nameAr: 'الفلق', nameEn: 'Al-Falaq', versesCount: 5, type: 'meccan' },
  { number: 114, nameAr: 'الناس', nameEn: 'An-Nas', versesCount: 6, type: 'meccan' },
];
