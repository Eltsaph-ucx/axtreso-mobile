import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import ManagerRegister from "@/pages/ManagerRegister";
import ManagerLogin from "@/pages/ManagerLogin";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerTransactions from "./pages/ManagerTransactions";
import TransactionForm from "./pages/TransactionForm";
import ManagerSettings from "./pages/ManagerSettings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSalons from "./pages/AdminSalons";
import AdminSalonDetails from "./pages/AdminSalonDetails";
import AdminReports from "./pages/AdminReports";
import ReportPreview from "./pages/ReportPreview";
import ReportDownload from "./pages/ReportDownload";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/manager/register"} component={ManagerRegister} />
      <Route path={"/manager/login"} component={ManagerLogin} />
      {/* Manager Dashboard Routes */}
      <Route path={"/manager/dashboard"}>
        <ProtectedRoute>
          <ManagerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path={"/manager/transactions"}>
        <ProtectedRoute>
          <ManagerTransactions />
        </ProtectedRoute>
      </Route>
      <Route path={"/manager/transactions/add"}>
        <ProtectedRoute>
          <TransactionForm />
        </ProtectedRoute>
      </Route>
      <Route path={"/manager/transactions/:id/edit"}>
        <ProtectedRoute>
          <TransactionForm />
        </ProtectedRoute>
      </Route>
      <Route path={"/manager/settings"}>
        <ProtectedRoute>
          <ManagerSettings />
        </ProtectedRoute>
      </Route>
      
      {/* Admin Dashboard Routes */}
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/admin/salons"} component={AdminSalons} />
      <Route path={"/admin/salons/:id"} component={AdminSalonDetails} />
      <Route path={"/admin/reports"} component={AdminReports} />
      <Route path={"/admin/reports/:id"} component={ReportPreview} />
      <Route path={"/admin/reports/:id/download"} component={ReportDownload} />
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
