import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Analytics } from "@vercel/analytics/react";

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
const SearchPage = lazy(() => import("./pages/Search"));
import { NavBar } from "./components/NavBar";
import { PlayerBar } from "./components/PlayerBar";
import AudioProvider from "./components/AudioProvider";
import AmbientOverlay from "./components/AmbientOverlay";
import GlobalSearch from "./components/GlobalSearch";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
  <AudioProvider />
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
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/import" element={<ImportPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
  <GlobalSearch />
        <PlayerBar />
  <AmbientOverlay />
        <NavBar />
        <Analytics />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
