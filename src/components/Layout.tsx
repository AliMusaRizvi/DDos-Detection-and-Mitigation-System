import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col font-sans">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-text-primary font-semibold tracking-tight">
            <Shield className="w-6 h-6 text-brand" />
            <span>DDoS<span className="text-text-secondary">DEFEND</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className={`transition-colors ${location.pathname === '/' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>Home</Link>
            <Link to="/about" className={`transition-colors ${location.pathname === '/about' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>Project Details</Link>
            <Link to="/contact" className={`transition-colors ${location.pathname === '/contact' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>Contact</Link>
          </div>
          <Link to="/auth" className="pill-button px-5 py-2 text-sm font-medium">
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border-subtle text-center mt-auto bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-text-secondary font-semibold tracking-tight">
            <Shield className="w-5 h-5" />
            <span>DDoS<span className="text-text-muted">DEFEND</span></span>
          </div>
          <p className="text-text-muted font-mono text-xs">
            FINAL YEAR PROJECT &copy; {new Date().getFullYear()} &bull; TARIK KAVAK &bull; UNIVERSITY OF GREENWICH
          </p>
        </div>
      </footer>
    </div>
  );
}
