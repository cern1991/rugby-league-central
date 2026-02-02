import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, Home, X, Zap, Newspaper, Users, BarChart3, Search } from "lucide-react";
import { useState } from "react";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Fixtures", icon: Zap, href: "/live" },
    { label: "News", icon: Newspaper, href: "/news" },
    { label: "Tables", icon: BarChart3, href: "/tables" },
    { label: "Teams", icon: Users, href: "/teams" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer" data-testid="link-logo">
                <div className="w-10 h-10 rounded-xl border border-border bg-gradient-to-br from-card to-muted flex items-center justify-center">
                  <img src="/logo.svg" alt="Rugby League Central shield logo" className="w-7 h-7" />
                </div>
                <span className="sr-only">Rugby League Central</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 text-sm">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    location === item.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                data-testid="button-open-search"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted"
                aria-label="Open search"
              >
                <Search className="w-4 h-4" />
              </button>
              <ThemeCustomizer />

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="relative z-50 lg:hidden p-2 rounded-lg hover:bg-muted bg-card/90 border border-border"
                data-testid="button-menu-toggle"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card">
            <nav className="p-4 space-y-1">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div 
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      location === item.href 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Rugby League Central</DialogTitle>
          </DialogHeader>
          <GlobalSearch onResultSelect={() => setIsSearchOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold tracking-wide">Rugby League Central</span>
          </div>
          <p className="text-xs text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Rugby League Central is an independent fan project and is not affiliated with the NRL, RFL, Super League, or any professional club. All club names, logos, and competition marks remain the property of their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
}
