import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, Home, X, Calendar, Newspaper, Users, Trophy, Search, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [visibleNavCount, setVisibleNavCount] = useState(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Teams", icon: Users, href: "/teams" },
    { label: "Fixtures", icon: Calendar, href: "/live" },
    { label: "Tables", icon: Trophy, href: "/tables" },
    { label: "News", icon: Newspaper, href: "/news" },
  ];

  useEffect(() => {
    const updateVisibleItems = () => {
      if (!navRef.current || !measureRef.current) return;
      const containerWidth = navRef.current.clientWidth;
      if (!containerWidth) return;

      const itemNodes = Array.from(measureRef.current.querySelectorAll<HTMLElement>("[data-measure=\"item\"]"));
      const moreNode = measureRef.current.querySelector<HTMLElement>("[data-measure=\"more\"]");
      const itemWidths = itemNodes.map((node) => node.getBoundingClientRect().width);
      const moreWidth = moreNode?.getBoundingClientRect().width ?? 0;

      let total = 0;
      let count = 0;
      for (let i = 0; i < itemWidths.length; i += 1) {
        const remaining = itemWidths.length - (i + 1);
        const reserve = remaining > 0 ? moreWidth : 0;
        if (total + itemWidths[i] + reserve <= containerWidth) {
          total += itemWidths[i];
          count += 1;
        } else {
          break;
        }
      }
      setVisibleNavCount(count);
    };

    const handleResize = () => updateVisibleItems();
    updateVisibleItems();

    const observer = new ResizeObserver(handleResize);
    if (navRef.current) observer.observe(navRef.current);
    if (measureRef.current) observer.observe(measureRef.current);
    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [navItems.length]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreButtonRef.current?.contains(target)) return;
      setIsMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMoreOpen]);

  const visibleNavItems = navItems.slice(0, visibleNavCount || navItems.length);
  const overflowNavItems = navItems.slice(visibleNavItems.length);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="rlc-header sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer" data-testid="link-logo">
                <div className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center">
                  <img src="/logo.svg" alt="Rugby League Central shield logo" className="w-7 h-7" />
                </div>
                <span className="sr-only">Rugby League Central</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center">
              <nav ref={navRef} className="flex items-center gap-1 text-sm max-w-full">
                {visibleNavItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
                      location === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                ))}
                {overflowNavItems.length > 0 && (
                  <div className="relative">
                    <button
                      ref={moreButtonRef}
                      onClick={() => setIsMoreOpen((prev) => !prev)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent",
                        isMoreOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      aria-expanded={isMoreOpen}
                      aria-haspopup="menu"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      More
                    </button>
                    {isMoreOpen && (
                      <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-card shadow-xl py-2 z-50">
                        {overflowNavItems.map((item) => (
                          <Link key={item.href} href={item.href}>
                            <div
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                                location === item.href
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                              onClick={() => setIsMoreOpen(false)}
                            >
                              <item.icon className="w-4 h-4" />
                              {item.label}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>

            <div
              ref={measureRef}
              className="absolute -left-[9999px] top-0 flex items-center gap-1 text-sm opacity-0 pointer-events-none"
              aria-hidden="true"
            >
              {navItems.map((item) => (
                <div
                  key={item.href}
                  data-measure="item"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              ))}
              <div data-measure="more" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                <MoreHorizontal className="w-4 h-4" />
                More
              </div>
            </div>

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
                className="rlc-menu-toggle relative z-50 lg:hidden p-2 rounded-lg hover:bg-muted bg-card/90 border border-border"
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
