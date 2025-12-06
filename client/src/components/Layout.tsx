import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Trophy, Settings, Menu, User, LogOut, Shield, Home, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Settings", icon: Settings, href: "/settings" },
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
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Trophy className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight hidden sm:inline">
                  Rugby League Central
                </span>
                <span className="font-display font-bold text-xl tracking-tight sm:hidden">
                  RLC
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
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
              {!loading && (
                <>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-lg transition-colors" data-testid="button-user-menu">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 ring-2 ring-background flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium hidden lg:inline" data-testid="text-user-email">{user.email}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {!user.twoFactorEnabled && (
                          <DropdownMenuItem onClick={() => setLocation("/setup-2fa")} data-testid="menu-setup-2fa">
                            <Shield className="mr-2 h-4 w-4" />
                            Setup 2FA
                          </DropdownMenuItem>
                        )}
                        {user.twoFactorEnabled && (
                          <DropdownMenuItem disabled>
                            <Shield className="mr-2 h-4 w-4 text-green-500" />
                            2FA Enabled
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout} data-testid="menu-logout">
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setLocation("/login")} data-testid="button-login">
                        Login
                      </Button>
                      <Button size="sm" onClick={() => setLocation("/register")} data-testid="button-register">
                        Register
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="md:hidden p-2 rounded-lg hover:bg-muted"
                data-testid="button-menu-toggle"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="p-4 space-y-1">
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
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span>Rugby League Central</span>
            </div>
            <p>Data provided by TheSportsDB</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
