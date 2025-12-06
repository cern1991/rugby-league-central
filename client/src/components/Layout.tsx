import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Trophy, Newspaper, Calendar, Settings, Menu, Search, Bell } from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", icon: Trophy, href: "/" },
    { label: "News", icon: Newspaper, href: "/news" },
    { label: "Schedule", icon: Calendar, href: "/schedule" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">SportSync</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-muted">
            <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar / Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Trophy className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">SportSync</span>
        </div>

        <div className="px-4 py-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search teams, leagues..." 
                    className="w-full bg-muted/50 border border-transparent focus:border-primary/50 rounded-lg py-2 pl-9 pr-4 text-sm outline-none transition-all"
                />
            </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
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

        <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/10">
                <div className="flex-1">
                    <p className="text-xs font-bold text-primary">Pro Access</p>
                    <p className="text-[10px] text-muted-foreground">Get advanced stats & ad-free</p>
                </div>
                <button className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded shadow-sm">
                    Upgrade
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 hidden md:flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-muted-foreground">
                {location === "/" ? "Overview" : location.substring(1).charAt(0).toUpperCase() + location.substring(2)}
            </h2>
            <div className="flex items-center gap-4">
                <button className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 ring-2 ring-background"></div>
            </div>
        </header>
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
        </div>
      </main>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
