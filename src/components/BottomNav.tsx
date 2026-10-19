import { useState, useEffect } from 'react';
import { Home, GraduationCap, Gamepad2, Palette, BookMarked, Heart } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BottomNavProps {
  active: string;
  onNavigate: (page: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  home: Home,
  education: GraduationCap,
  quran: BookMarked,
  health: Heart,
  games: Gamepad2,
  services: Palette,
};

const DEFAULT_ORDER = ['home', 'education', 'quran', 'health', 'games', 'services'];
const LS_KEY = 'bottom-nav-order-v2';

// Single sortable tab item
const SortableTab = ({
  id,
  label,
  isActive,
  onNavigate,
  isEditMode,
}: {
  id: string;
  label: string;
  isActive: boolean;
  onNavigate: (key: string) => void;
  isEditMode: boolean;
}) => {
  const Icon = ICON_MAP[id] || Home;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-1 flex flex-col items-center"
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      <button
        onClick={() => {
          if (!isEditMode) onNavigate(id);
        }}
        className={`w-full flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl transition-all duration-300 select-none
          ${isActive && !isEditMode ? 'text-primary scale-110' : 'text-muted-foreground hover:text-primary/70'}
          ${isEditMode ? 'cursor-grab active:cursor-grabbing border border-dashed border-border/60' : ''}
        `}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
        <span className="text-[10px] font-medium truncate w-full text-center">{label}</span>
        {isActive && !isEditMode && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
      </button>
    </div>
  );
};

const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  const { t, lang } = useLang();

  const labelMap = (key: string): string => {
    if (key === 'home') return t('home');
    if (key === 'education') return t('education');
    if (key === 'quran') return lang === 'ar' ? 'القرآن' : 'Quran';
    if (key === 'health') return lang === 'ar' ? 'الصحة' : 'Health';
    if (key === 'games') return t('games');
    if (key === 'services') return t('services');
    return key;
  };

  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) return parsed;
      }
    } catch {}
    return DEFAULT_ORDER;
  });

  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(order));
  }, [order]);

  // @dnd-kit sensors — TouchSensor with proper delay+tolerance so scrolling isn't blocked
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,      // ms long-press before drag activates
        tolerance: 5,    // px movement allowed during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: draggedItem, over } = event;
    if (over && draggedItem.id !== over.id) {
      setOrder(prev => {
        const oldIndex = prev.indexOf(String(draggedItem.id));
        const newIndex = prev.indexOf(String(over.id));
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 pb-safe">
        {/* Edit mode bar */}
        {isEditMode && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-primary/10 border-b border-border text-xs font-bold">
            <span className="text-muted-foreground">
              {lang === 'ar' ? '⇄ اسحب لإعادة الترتيب' : '⇄ Drag to reorder'}
            </span>
            <button
              onClick={() => setIsEditMode(false)}
              className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold"
            >
              {lang === 'ar' ? '✓ حفظ' : '✓ Done'}
            </button>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={horizontalListSortingStrategy}>
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
              {order.map(key => (
                <SortableTab
                  key={key}
                  id={key}
                  label={labelMap(key)}
                  isActive={active === key}
                  onNavigate={onNavigate}
                  isEditMode={isEditMode}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Edit toggle button — small dot above nav */}
        {!isEditMode && (
          <button
            onClick={() => setIsEditMode(true)}
            className="absolute -top-7 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-[10px] px-3 py-0.5 rounded-t-lg border border-border border-b-0 hover:bg-secondary transition-colors"
            title={lang === 'ar' ? 'إعادة ترتيب التبويبات' : 'Reorder tabs'}
          >
            {lang === 'ar' ? '⇄ ترتيب' : '⇄ Reorder'}
          </button>
        )}
      </nav>
    </>
  );
};

export default BottomNav;
