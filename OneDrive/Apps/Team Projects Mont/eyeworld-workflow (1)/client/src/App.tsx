import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DirectorDashboard from "@/pages/DirectorDashboard";
import CreateRequest from "@/pages/CreateRequest";
import TaskDetail from "@/pages/RequestDetails";
import MediaBuyerDashboard from "@/pages/MediaBuyerDashboard";
import BriefBoard from "@/pages/BriefBoard";
import ActivityLog from "@/pages/ActivityLog";
import NotFound from "@/pages/NotFound";

function Router() {
  // Check if user is logged in via localStorage (set on PIN login)
  const storedUser = localStorage.getItem("user");
  const isLoggedIn = !!storedUser;

  if (!isLoggedIn) {
    return <Login />;
  }

  const user = storedUser ? JSON.parse(storedUser) : null;

  // Director always lands on /director
  if (user?.role === "director" && window.location.pathname === "/") {
    window.location.replace("/director");
    return null;
  }

  return (
    <Switch>
      {/* Director dashboard */}
      <Route path="/director" component={DirectorDashboard} />

      {/* Team member dashboard */}
      <Route path="/" component={Dashboard} />

      {/* Task detail — main entry point for individual tasks */}
      <Route path="/task/:requestId">
        {(params) => <TaskDetail requestId={params.requestId} />}
      </Route>

      {/* Legacy request details path (for backwards compatibility) */}
      <Route path="/request/:requestId">
        {(params) => <TaskDetail requestId={params.requestId} />}
      </Route>

      {/* Kept for users who may navigate to these */}
      <Route path="/create" component={CreateRequest} />
      <Route path="/media-buyer" component={MediaBuyerDashboard} />
      <Route path="/briefs" component={BriefBoard} />
      <Route path="/activity" component={ActivityLog} />
      <Route path="/404" component={NotFound} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
