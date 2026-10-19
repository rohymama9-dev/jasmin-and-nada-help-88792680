const fs = require('fs');
const path = require('path');

const filesToFix = [
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
];

filesToFix.forEach(f => {
    const fullPath = path.join(__dirname, f);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    let modified = false;

    if (!content.includes('from "sonner"') && !content.includes("from 'sonner'")) {
        // If it imports toast from use-toast, remove it
        content = content.replace(/import\s+\{\\s*toast\s*\}\s+from\s+['"]@\/hooks\/use-toast['"];?\n?/g, '');
        content = "import { toast } from 'sonner';\n" + content;
        modified = true;
    }
    
    // Replace alert(X) with toast(X)
    const newContent = content.replace(/\balert\(([^)]+)\);?/g, 'toast($1);')
                              .replace(/window\.alert\(([^)]+)\);?/g, 'toast($1);');
                              
    if (content !== newContent || modified) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        content = newContent;
    }
    
    // For confirm, let's auto-replace the `if (!confirm(MSG)) return;` pattern with a toast action
    // Note: since toast is async and non-blocking, we can't just replace `confirm` inline.
    // I will write a simple regex to replace specific ones, or log them to fix manually.
    if (content.includes('confirm(')) {
        console.log(`File ${f} has confirm() calls that need manual review.`);
    }
});

console.log('Alerts replaced!');
