import { Outlet, Link, createRootRoute, useRouterState } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initDailyVisitTracker } from "@/lib/dailyVisit";
import { useLocalNotifications } from "@/hooks/useNotifications";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 safe-area-padding">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient());
  useLocalNotifications();
  useEffect(() => { initDailyVisitTracker(); }, []);

  useEffect(() => {
    let activeMinutes = 0;
    let lastActivity = Date.now();
    
    const updateActivity = () => {
       lastActivity = Date.now();
    };
    
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('keydown', updateActivity);
    
    const interval = setInterval(() => {
       if (Date.now() - lastActivity < 60000) { // active in last minute
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          const historyStr = localStorage.getItem('nada_helps_history') || '{}';
          const history = JSON.parse(historyStr);
          if (!history[today]) history[today] = { minutesActive: 0, cupsDrunk: 0, pointsEarned: 0 };
          history[today].minutesActive += 1;
          localStorage.setItem('nada_helps_history', JSON.stringify(history));
       }
    }, 60000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, []);

  const routerState = useRouterState();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AnimatePresence mode="wait">
          <motion.div
            key={routerState.location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full min-h-[100dvh]"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
