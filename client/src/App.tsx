import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PaymentGateway from "@/pages/PaymentGateway";

import FirebaseDashboard from "@/pages/admin/FirebaseDashboard";
import FirebaseLogin from "@/pages/admin/FirebaseLogin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/payment" component={PaymentGateway} />
      {/* Admin Routes */}
      <Route path="/admin" component={FirebaseDashboard} />
      <Route path="/admin/login" component={FirebaseLogin} />
      <Route path="/admin/firebase" component={FirebaseDashboard} />
      <Route path="/admin/firebase/login" component={FirebaseLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans" dir="rtl">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
