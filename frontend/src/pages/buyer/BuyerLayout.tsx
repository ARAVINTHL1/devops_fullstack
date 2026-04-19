import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Package, ShoppingCart, LogOut, Factory, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import BuyerChatbot from "@/components/buyer/BuyerChatbot";
import { NotificationBell } from "@/components/NotificationBell";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/buyer/dashboard", icon: LayoutDashboard },
  { label: "Products", path: "/buyer/products", icon: Package },
  { label: "Orders", path: "/buyer/orders", icon: ShoppingCart },
  { label: "Reviews", path: "/buyer/reviews", icon: MessageSquare },
];

const BuyerLayout = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const navMenu = (
    <div className="inline-flex min-w-max items-center gap-2 rounded-xl border border-white/20 bg-white/10 p-1.5">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-white text-[#153a70] shadow-sm ring-1 ring-white/30"
                : "text-blue-50/90 hover:text-white hover:bg-white/15"
            )
          }
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-[#0b2a55]/60 bg-gradient-to-r from-[#0f2f5f] via-[#133b75] to-[#19508f] shadow-[0_8px_24px_rgba(16,45,92,0.22)] backdrop-blur-sm">
        <div className="px-4 lg:px-6 py-3">
          <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4">
            <div className="flex items-center gap-3 min-w-0 justify-self-start">
              <div className="w-9 h-9 rounded-lg bg-white/15 ring-1 ring-white/25 flex items-center justify-center flex-shrink-0">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold font-display tracking-wide text-white">MS Garments</h1>
                <p className="text-[10px] text-blue-100/80 uppercase tracking-[0.12em]">Buyer Portal</p>
              </div>
            </div>

            <div className="justify-self-center">
              {navMenu}
            </div>

            <div className="flex items-center gap-2.5 justify-self-end">
              <div className="[&_button]:text-blue-50 [&_button:hover]:text-white [&_button:hover]:bg-white/10 [&_button]:transition-colors">
                <NotificationBell />
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/25 bg-white/10">
                <div className="w-6 h-6 rounded-full bg-white/20 ring-1 ring-white/30 flex items-center justify-center text-[10px] font-bold text-white">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-blue-50 truncate max-w-[120px]">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-blue-50 border border-white/20 hover:border-white/35 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/15 ring-1 ring-white/25 flex items-center justify-center flex-shrink-0">
                  <Factory className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold font-display tracking-wide text-white">MS Garments</h1>
                  <p className="text-[10px] text-blue-100/80 uppercase tracking-[0.12em]">Buyer Portal</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="[&_button]:text-blue-50 [&_button:hover]:text-white [&_button:hover]:bg-white/10 [&_button]:transition-colors">
                  <NotificationBell />
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-blue-50 border border-white/20 hover:border-white/35 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <nav className="pt-3">
              <div className="w-full flex justify-center overflow-x-auto">
                {navMenu}
              </div>
            </nav>
          </div>
            </div>
      </header>

      <main className="overflow-x-hidden">
        <Outlet />
      </main>
      <BuyerChatbot />
    </div>
  );
};

export default BuyerLayout;
