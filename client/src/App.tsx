import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import Home from "@/pages/Home";

const LiveScores = lazy(() => import("@/pages/LiveScores"));
const News = lazy(() => import("@/pages/News"));
const LeagueTables = lazy(() => import("@/pages/LeagueTables"));
const Teams = lazy(() => import("@/pages/Teams"));
const Players = lazy(() => import("@/pages/Players"));
const MatchDetail = lazy(() => import("@/pages/MatchDetail"));
const TeamPage = lazy(() => import("@/pages/Team"));
const PlayerPage = lazy(() => import("@/pages/Player"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/live" component={LiveScores} />
      <Route path="/news" component={News} />
      <Route path="/tables" component={LeagueTables} />
      <Route path="/teams" component={Teams} />
      <Route path="/players" component={Players} />
      <Route path="/match/:id" component={MatchDetail} />
      <Route path="/team/:id" component={TeamPage} />
      <Route path="/player/:id" component={PlayerPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
