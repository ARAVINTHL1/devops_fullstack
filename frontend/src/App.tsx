import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminLowStockAlerts from "./pages/admin/AdminLowStockAlerts";
import AdminSuppliers from "./pages/admin/AdminSuppliers";
import AdminMLInsights from "./pages/admin/AdminMLInsights";
import AdminMLPredictions from "./pages/admin/AdminMLPredictions";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminReports from "./pages/admin/AdminReports";
import AdminReviews from "./pages/admin/AdminReviews";

// Employee pages
import EmployeeLayout from "./pages/employee/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeProducts from "./pages/employee/EmployeeProducts";
import EmployeeOrders from "./pages/employee/EmployeeOrders";
import EmployeeInventory from "./pages/employee/EmployeeInventory";
import EmployeeLowStockAlerts from "./pages/employee/EmployeeLowStockAlerts";
import EmployeeSuppliers from "./pages/employee/EmployeeSuppliers";
import EmployeeMLInsights from "./pages/employee/EmployeeMLInsights";
import EmployeeReports from "./pages/employee/EmployeeReports";
import EmployeeReviews from "./pages/employee/EmployeeReviews";

// Buyer pages
import BuyerLayout from "./pages/buyer/BuyerLayout";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import BuyerProducts from "./pages/buyer/BuyerProducts";
import BuyerOrders from "./pages/buyer/BuyerOrders";
import BuyerReviews from "./pages/buyer/BuyerReviews";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading session...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading session...</div>;
  }

  return isAuthenticated ? <RoleRedirect /> : <>{children}</>;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case "admin": return <Navigate to="/admin/dashboard" replace />;
    case "employee": return <Navigate to="/employee/dashboard" replace />;
    case "buyer": return <Navigate to="/buyer/dashboard" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

const RoleRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Array<"admin" | "employee" | "buyer">;
}) => {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <RoleRedirect />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

    {/* Admin Routes */}
    <Route element={<RoleRoute allowedRoles={["admin"]}><AdminLayout /></RoleRoute>}>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/inventory" element={<AdminInventory />} />
      <Route path="/admin/alerts" element={<AdminLowStockAlerts />} />
      <Route path="/admin/suppliers" element={<AdminSuppliers />} />
      <Route path="/admin/ml-insights" element={<AdminMLInsights />} />
      <Route path="/admin/ml-predictions" element={<AdminMLPredictions />} />
      <Route path="/admin/users" element={<AdminUserManagement />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/reviews" element={<AdminReviews />} />
    </Route>

    {/* Employee Routes */}
    <Route element={<RoleRoute allowedRoles={["employee"]}><EmployeeLayout /></RoleRoute>}>
      <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
      <Route path="/employee/products" element={<EmployeeProducts />} />
      <Route path="/employee/orders" element={<EmployeeOrders />} />
      <Route path="/employee/inventory" element={<EmployeeInventory />} />
      <Route path="/employee/alerts" element={<EmployeeLowStockAlerts />} />
      <Route path="/employee/suppliers" element={<EmployeeSuppliers />} />
      <Route path="/employee/ml-insights" element={<EmployeeMLInsights />} />
      <Route path="/employee/reports" element={<EmployeeReports />} />
      <Route path="/employee/reviews" element={<EmployeeReviews />} />
    </Route>

    {/* Buyer Routes */}
    <Route element={<RoleRoute allowedRoles={["buyer"]}><BuyerLayout /></RoleRoute>}>
      <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
      <Route path="/buyer/products" element={<BuyerProducts />} />
      <Route path="/buyer/orders" element={<BuyerOrders />} />
      <Route path="/buyer/reviews" element={<BuyerReviews />} />
    </Route>

    {/* Legacy redirects */}
    <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
