import { Home, Library, Settings, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Bottom navigation bar with mobile-first design
 * Fixed position for easy thumb access
 */
export function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Library, label: 'Library', path: '/library' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-all',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-6 w-6', isActive && 'scale-110')} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
        {/* Search page trigger */}
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-muted-foreground transition-colors hover:text-foreground"
          title="Search"
        >
          <Search className="h-6 w-6" />
          <span className="text-xs font-medium">Search</span>
        </button>
      </div>
    </nav>
  );
}
