import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import ManagerRegister from "@/pages/ManagerRegister";
import ManagerLogin from "@/pages/ManagerLogin";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerTransactions from "./pages/ManagerTransactions";
import TransactionForm from "./pages/TransactionForm";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/manager/register"} component={ManagerRegister} />
      <Route path={"/manager/login"} component={ManagerLogin} />
      {/* Manager Dashboard Routes */}
      <Route path={"/manager/dashboard"} component={ManagerDashboard} />
      <Route path={"/manager/transactions"} component={ManagerTransactions} />
      <Route path={"/manager/transactions/add"} component={TransactionForm} />
      <Route path={"/manager/transactions/:id/edit"} component={TransactionForm} />
      <Route path={"/manager/settings"} component={() => <div>Settings - Coming Soon</div>} />
      
      {/* Admin Dashboard Routes - To be implemented */}
      <Route path={"/admin/dashboard"} component={() => <div>Admin Dashboard - Coming Soon</div>} />
      <Route path={"/admin/salons"} component={() => <div>Salons Management - Coming Soon</div>} />
      <Route path={"/admin/reports"} component={() => <div>Reports - Coming Soon</div>} />
      <Route path={"/admin/settings"} component={() => <div>Admin Settings - Coming Soon</div>} />
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
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
