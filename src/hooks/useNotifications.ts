import { useEffect } from "react";
import { toast } from "sonner";

export function useLocalNotifications() {
  useEffect(() => {
    // Request Notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const playBuzzer = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
        console.error("Audio play failed", e);
      }
    };

    const checkAlarms = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const today = now.toDateString();

      // Check Meds
      try {
        const meds = JSON.parse(localStorage.getItem('app-meds') || '[]');
        const checkedMeds = JSON.parse(localStorage.getItem('app-meds-checked') || '{}');
        const checkedIds = checkedMeds.date === today ? (checkedMeds.ids || []) : [];
        
        meds.forEach((m: any) => {
          if (m.time === currentTime && !checkedIds.includes(m.id)) {
            const notifKey = `notified-med-${m.id}-${today}-${currentTime}`;
            if (!localStorage.getItem(notifKey)) {
              localStorage.setItem(notifKey, 'true');
              playBuzzer();
              toast.info(`حان موعد الدواء: ${m.name}`, { duration: 15000 });
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('تذكير بالدواء', { body: `حان موعد دواء: ${m.name}`, icon: '/pwa-192x192.png' });
              }
            }
          }
        });
      } catch (e) {}

      // Check Habits
      try {
        const habits = JSON.parse(localStorage.getItem('app-habits') || '[]');
        const checkedHabits = JSON.parse(localStorage.getItem('app-habits-checked') || '{}');
        const checkedIds = checkedHabits.date === today ? (checkedHabits.ids || []) : [];
        
        habits.forEach((h: any) => {
          if (h.time === currentTime && !checkedIds.includes(h.id)) {
             const notifKey = `notified-habit-${h.id}-${today}-${currentTime}`;
             if (!localStorage.getItem(notifKey)) {
               localStorage.setItem(notifKey, 'true');
               playBuzzer();
               toast.info(`حان موعد العادة: ${h.name}`, { duration: 15000 });
               if ('Notification' in window && Notification.permission === 'granted') {
                 new Notification('تذكير بعادة', { body: `حان وقت: ${h.name}`, icon: '/pwa-192x192.png' });
               }
             }
          }
        });
      } catch (e) {}
    };

    const interval = setInterval(checkAlarms, 30000); // 30s polling
    checkAlarms(); // initial check

    return () => clearInterval(interval);
  }, []);
}
