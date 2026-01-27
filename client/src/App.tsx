import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Home from "@/pages/Home";

const LiveScores = lazy(() => import("@/pages/LiveScores"));
const News = lazy(() => import("@/pages/News"));
const NewsArticle = lazy(() => import("@/pages/NewsArticle"));
const LeagueTables = lazy(() => import("@/pages/LeagueTables"));
const Teams = lazy(() => import("@/pages/Teams"));
const MatchDetail = lazy(() => import("@/pages/MatchDetail"));
const TeamPage = lazy(() => import("@/pages/Team"));
const PlayerPage = lazy(() => import("@/pages/Player"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const TwoFactorVerify = lazy(() => import("@/pages/TwoFactorVerify"));
const Setup2FA = lazy(() => import("@/pages/Setup2FA"));
const Settings = lazy(() => import("@/pages/Settings"));
const TeamSelection = lazy(() => import("@/components/TeamSelection"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/live" component={LiveScores} />
      <Route path="/news" component={News} />
      <Route path="/news/article/:encoded" component={NewsArticle} />
      <Route path="/tables" component={LeagueTables} />
      <Route path="/teams" component={Teams} />
      <Route path="/match/:id" component={MatchDetail} />
      <Route path="/team/:id" component={TeamPage} />
      <Route path="/player/:id" component={PlayerPage} />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
              <Router />
            </Suspense>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
