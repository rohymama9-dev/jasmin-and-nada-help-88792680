import os
import re

files_to_fix = [
    'src/components/AdminUploadForm.tsx',
    'src/components/CombinedOrderForm.tsx',
    'src/components/DietTracker.tsx',
    'src/components/ExerciseTimer.tsx',
    'src/components/HiddenAdminGate.tsx',
    'src/components/MedicationReminder.tsx',
    'src/components/PrivateUploadInline.tsx',
    'src/components/PronunciationExercise.tsx',
    'src/components/RecitationRoom.tsx',
    'src/components/SleepTracker.tsx',
    'src/components/UploadedLibrary.tsx',
    'src/components/WalkingTimer.tsx',
    'src/pages/ExercisesPage.tsx',
    'src/pages/GamesPage.tsx'
]

for f in files_to_fix:
    if not os.path.exists(f):
        continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Simple alert replacement
    # alert(lang === 'ar' ? '...' : '...') -> toast(lang === 'ar' ? '...' : '...')
    # This might need careful matching if it spans multiple lines.
    # A robust way is to just replace 'alert(' with 'toast(' if sonner is imported, 
    # but we need to ensure 'import { toast } from \"sonner\";' exists.
    
    # Let's see if sonner is imported
    if 'from \"sonner\"' not in content and 'from \x27sonner\x27' not in content:
        content = \"import { toast } from 'sonner';\\n\" + content
    
    # Replace alert(X) with toast(X)
    content = re.sub(r'\\balert\\((.*?)\\);?', r'toast(\\1);', content, flags=re.DOTALL)
    content = re.sub(r'window\\.alert\\((.*?)\\);?', r'toast(\\1);', content, flags=re.DOTALL)

    # For confirm(X), we can't easily auto-replace because it's used in if (!confirm(X)) return;
    # We will just print occurrences of confirm so we can fix them manually or with a more specific script.
    if 'confirm(' in content:
        print(f'File {f} has confirm() calls that need manual review.')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print('Alerts replaced!')
