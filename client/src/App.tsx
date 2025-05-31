import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setupAuthInterceptor } from "@/lib/auth";
import LoginPage from "@/pages/LoginPage";
import DoctorDashboard from "@/pages/DoctorDashboard";
import ReceptionistDashboard from "@/pages/ReceptionistDashboard";
import NotFound from "@/pages/not-found";

// Setup auth interceptor on app startup
setupAuthInterceptor();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/doctor" component={DoctorDashboard} />
      <Route path="/receptionist" component={ReceptionistDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
