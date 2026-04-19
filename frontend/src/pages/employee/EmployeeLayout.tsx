import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, TruckIcon,
  Brain, BarChart3, LogOut, Factory, ChevronLeft, ChevronRight, MessageSquare, AlertTriangle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
  { label: "Products", path: "/employee/products", icon: Package },
  { label: "Orders", path: "/employee/orders", icon: ShoppingCart },
  { label: "Inventory", path: "/employee/inventory", icon: Warehouse },
  { label: "Low Stock Alerts", path: "/employee/alerts", icon: AlertTriangle },
  { label: "Suppliers", path: "/employee/suppliers", icon: TruckIcon },
  { label: "ML Insights", path: "/employee/ml-insights", icon: Brain },
  { label: "Reports", path: "/employee/reports", icon: BarChart3 },
  { label: "Reviews", path: "/employee/reviews", icon: MessageSquare },
];

const EmployeeLayout = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn("sidebar-gradient h-screen flex flex-col transition-all duration-300 sticky top-0", collapsed ? "w-[72px]" : "w-64")}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Factory className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold font-display text-sidebar-accent-foreground">MS Garments</h1>
              <p className="text-[10px] text-sidebar-foreground/60">Employee Portal</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50")}>
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span className="animate-fade-in">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2 mb-2 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">{user.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-sidebar-foreground/60 capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={logout} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent/50 transition-colors">
              <LogOut className="w-4 h-4" />{!collapsed && "Sign Out"}
            </button>
            <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors">
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
          <h2 className="text-sm font-semibold text-muted-foreground">Employee Portal</h2>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-x-hidden"><Outlet /></main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
