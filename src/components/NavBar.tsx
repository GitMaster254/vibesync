import { useState, useEffect } from 'react';
import { Home, Music, Settings, CompassIcon, Menu, X, Users,Video,Film } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Responsive navigation component
 * Mobile: Bottom navigation bar
 * Desktop: Collapsible sidebar with hamburger menu
 */
export function NavBar({ sidebarOpen, setSidebarOpen, isDesktop }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Music, label: 'Music', path: '/library' },
    { icon: CompassIcon, label: 'Explore', path: '/explore' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [location, isDesktop, setSidebarOpen]);

  // Auto-close sidebar when switching to mobile
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop, setSidebarOpen]);

  // Mobile Bottom Navigation
  const MobileNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg pb-safe md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all min-w-0 flex-1',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
              <span className="text-xs font-medium truncate max-w-[70px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  // Desktop Sidebar with integrated hamburger and better spacing
  const DesktopSidebar = () => (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ease-in-out fixed left-0 top-0 z-30',
          sidebarOpen ? 'w-64' : 'w-20' // Wider when collapsed for better spacing
        )}
      >
        {/* Header with integrated hamburger menu */}
        <div className={cn(
          'flex items-center border-b border-border transition-all duration-300',
          sidebarOpen ? 'p-6 justify-start gap-4' : 'p-4 justify-center'
        )}>
          <button
            type="button"
            aria-label={sidebarOpen ? 'Collapse sidebar navigation' : 'Expand sidebar navigation'}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              'rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-accent',
              sidebarOpen ? 'h-8 w-8' : 'h-10 w-10' // Larger button when collapsed for easier clicking
            )}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          {sidebarOpen && (
            <h1 className="text-xl font-bold transition-opacity duration-300">VibeSync</h1>
          )}
        </div>

        {/* Navigation Items with modern music player spacing */}
        <nav className={cn(
          'flex-1 transition-all duration-300',
          sidebarOpen ? 'px-6 py-8 space-y-3' : 'px-4 py-8 space-y-4' // Adjusted spacing
        )}>
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center transition-all duration-300 hover:bg-accent group relative',
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                  sidebarOpen 
                    ? 'rounded-lg px-4 py-3 gap-4' // Adjusted padding for smaller icons
                    : 'rounded-full justify-center p-3' // Adjusted padding for smaller icons
                )}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon className={cn(
                  'flex-shrink-0 transition-transform duration-300',
                  sidebarOpen ? 'h-5 w-5' : 'h-6 w-6', // Smaller icons
                  isActive && 'scale-110'
                )} />
                
                {/* Label - visible when expanded */}
                {sidebarOpen && (
                  <span className="text-sm font-medium transition-all duration-300">
                    {label}
                  </span>
                )}
                
                {/* Tooltip for collapsed state */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border scale-0 group-hover:scale-100 transition-transform origin-left whitespace-nowrap z-50">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );

  return (
    <>
      {!isDesktop ? <MobileNav /> : <DesktopSidebar />}
    </>
  );
}