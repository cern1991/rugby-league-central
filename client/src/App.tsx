import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { TeamSelection } from "@/components/TeamSelection";
import { useState, useEffect } from "react";
import Home from "@/pages/Home";
import MatchDetail from "@/pages/MatchDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import TwoFactorVerify from "@/pages/TwoFactorVerify";
import Setup2FA from "@/pages/Setup2FA";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeWithWelcome} />
      <Route path="/match/:id" component={MatchDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-2fa" component={TwoFactorVerify} />
      <Route path="/setup-2fa" component={Setup2FA} />
      <Route path="/setup-preferences" component={TeamSelection} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function HomeWithWelcome() {
  const [showWelcome, setShowWelcome] = useState(() => {
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    return !hasSeenWelcome;
  });

  const handleWelcomeComplete = () => {
    sessionStorage.setItem("hasSeenWelcome", "true");
    setShowWelcome(false);
  };

  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  return <Home />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
