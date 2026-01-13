import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { cn } from '@/lib/utils';
import { getCurrentUser } from "@/lib/auth";
import { initializeWebSocket } from "@/lib/websocket-service";

const Index = lazy(() => import("./pages/Index"));
const Player = lazy(() => import("./pages/Player"));
const Library = lazy(() => import("./pages/Library"));
const PlaylistDetail = lazy(() => import("./pages/PlaylistDetail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ImportPage = lazy(() => import("./pages/Import"));
const RecentlyPlayed = lazy(() => import("./pages/RecentlyPlayed"));
const RecentlyAdded = lazy(() => import("./pages/RecentlyAdded"));
const MostPlayed = lazy(() => import("./pages/MostPlayed"));
const ExplorerPage = lazy(() => import("./pages/explorer"));
const Terms = lazy(() => import("./pages/Terms"));
import { NavBar } from "./components/NavBar";
import { PlayerBar } from "./components/PlayerBar";
import AudioProvider from "./components/AudioProvider";
import AmbientOverlay from "./components/AmbientOverlay";
import GlobalSearch from "./components/GlobalSearch";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if we're on desktop
  useEffect(() => {
    const user = getCurrentUser();
    initializeWebSocket(user.id);
    
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AudioProvider />
          <div className="flex flex-col min-h-screen md:flex-row">
            {/* NavBar with sidebar state management */}
            <NavBar 
              sidebarOpen={sidebarOpen} 
              setSidebarOpen={setSidebarOpen}
              isDesktop={isDesktop}
            />
            
            {/* Main content area with dynamic padding based on sidebar state */}
            <main className={cn(
              "flex-1 transition-all duration-300",
              isDesktop 
                ? sidebarOpen 
                  ? "md:ml-64 md:pl-4"  // Sidebar open
                  : "md:ml-16 md:pl-4"  // Sidebar closed (hamburger only)
                : "pb-20"  // Mobile bottom nav padding
            )}>
              <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading…</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/player" element={<Player />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/playlist/:id" element={<PlaylistDetail />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/recently-played" element={<RecentlyPlayed />} />
                  <Route path="/recently-added" element={<RecentlyAdded />} />
                  <Route path="/most-played" element={<MostPlayed />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/explore" element={<ExplorerPage />}/>
                  <Route path="/terms" element={<Terms />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
          
          {/* Global components that need proper positioning */}
          <GlobalSearch />
          <PlayerBar 
            sidebarOpen={sidebarOpen}
            isDesktop={isDesktop}
          />
          <AmbientOverlay />
          <Analytics />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
