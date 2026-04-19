import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { ShoppingCart, Package, ArrowUpRight, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBuyerDashboardApi, getBuyerOrdersApi, getBuyerProductsApi } from "@/lib/buyer-api";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

const BuyerDashboard = () => {
  const AUTO_SCROLL_MS = 2000;
  const CAROUSEL_START_STAGGER_MS = 4000;
  const { user, token } = useAuth();
  const [carouselApis, setCarouselApis] = useState<Record<string, CarouselApi | null>>({});

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["buyer-dashboard"],
    queryFn: () => getBuyerDashboardApi(token ?? ""),
    enabled: !!token,
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["buyer-products"],
    queryFn: () => getBuyerProductsApi(token ?? ""),
    enabled: !!token,
  });

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["buyer-orders"],
    queryFn: () => getBuyerOrdersApi(token ?? ""),
    enabled: !!token,
  });

  const stats = dashboardData?.stats;
  const products = productsData?.products ?? [];
  const orders = ordersData?.orders ?? [];

  const categoryOrder = ["Fabrics", "Garments", "Threads", "Dyes", "Accessories"];

  const productsByCategory = useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      const category = String(product.category ?? "").trim() || "Others";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, typeof products>);

    return Object.entries(grouped).sort(([a], [b]) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [products]);

  const categoryCarouselData = useMemo(() => {
    const MIN_LOOP_SLIDES = 6;

    return productsByCategory.map(([category, categoryProducts]) => {
      if (categoryProducts.length === 0) {
        return { category, categoryProducts, carouselProducts: categoryProducts };
      }

      const repeatCount = Math.max(1, Math.ceil(MIN_LOOP_SLIDES / categoryProducts.length));
      const carouselProducts = Array.from({ length: repeatCount }, () => categoryProducts).flat();

      return { category, categoryProducts, carouselProducts };
    });
  }, [productsByCategory]);

  const orderedProductMap = orders.reduce((acc, order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      const name = String(item?.product ?? "").trim();
      if (!name) return;
      if (!acc[name]) {
        acc[name] = { name, quantity: 0, orders: 0 };
      }
      acc[name].quantity += Number(item?.quantity ?? 0);
      acc[name].orders += 1;
    });
    return acc;
  }, {} as Record<string, { name: string; quantity: number; orders: number }>);

  const reorderSuggestions = Object.values(orderedProductMap)
    .sort((a, b) => b.orders - a.orders || b.quantity - a.quantity)
    .slice(0, 3);

  const lowStockOpportunities = products
    .filter((product) => product.stock > 0 && product.stock < 500)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 3);

  const setCategoryCarouselApi = (category: string, api: CarouselApi | null) => {
    setCarouselApis((prev) => (prev[category] === api ? prev : { ...prev, [category]: api }));
  };

  useEffect(() => {
    const timers: number[] = [];
    const delayedStarts: number[] = [];

    categoryCarouselData.forEach(({ category, carouselProducts }, index) => {
      const api = carouselApis[category];
      if (!api || carouselProducts.length <= 1) {
        return;
      }

      const startDelay = index * CAROUSEL_START_STAGGER_MS;
      const delayedStart = window.setTimeout(() => {
        api.scrollNext();

        const timer = window.setInterval(() => {
          api.scrollNext();
        }, AUTO_SCROLL_MS);

        timers.push(timer);
      }, startDelay);

      delayedStarts.push(delayedStart);
    });

    return () => {
      delayedStarts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timers.forEach((timer) => window.clearInterval(timer));
    };
  }, [AUTO_SCROLL_MS, CAROUSEL_START_STAGGER_MS, carouselApis, categoryCarouselData]);

  const categoryColor: Record<string, string> = {
    Fabrics: "bg-primary/10 text-primary",
    Garments: "bg-accent/10 text-accent-foreground",
    Threads: "bg-success/10 text-success",
    Dyes: "bg-info/10 text-info",
    Accessories: "bg-warning/10 text-warning",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Welcome, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Your wholesale shopping hub</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">My Orders</p>
              <p className="text-2xl font-bold font-display mt-1">{stats?.myOrders ?? 0}</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-4 h-4 text-success" />
                <span className="text-xs font-medium text-success">{stats?.activeOrders ?? 0} active</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-info/10 text-info"><ShoppingCart className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold font-display mt-1">₹{((stats?.totalSpent ?? 0) / 100000).toFixed(2)}L</p>
              <p className="text-xs text-muted-foreground mt-2">All orders</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent/10 text-accent">₹</div>
          </div>
        </div>
        <div className="stat-card animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Products Browsed</p>
              <p className="text-2xl font-bold font-display mt-1">{stats?.productsAvailable ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Available now</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary"><Package className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold font-display mb-4">Products by Category</h3>
        {isProductsLoading ? (
          <p className="text-sm text-muted-foreground">Loading products...</p>
        ) : productsByCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products found.</p>
        ) : (
          <div className="space-y-7">
            {categoryCarouselData.map(({ category, categoryProducts, carouselProducts }) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-semibold">{category}</h4>
                  <span className="text-xs text-muted-foreground">{categoryProducts.length} products</span>
                </div>

                <Carousel
                  setApi={(api) => setCategoryCarouselApi(category, api)}
                  opts={{ align: "start", loop: carouselProducts.length > 1, containScroll: false, duration: 35 }}
                  className="w-full"
                >
                  <CarouselContent>
                    {carouselProducts.map((product, index) => (
                      <CarouselItem key={`${product._id}-${index}`} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                        <div className="rounded-xl border border-border/70 bg-card p-3 h-full hover:shadow-md transition-shadow">
                          <div className="h-32 rounded-lg bg-secondary flex items-center justify-center mb-3 overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-contain bg-white" />
                            ) : (
                              <Package className="w-10 h-10 text-muted-foreground/40" />
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColor[product.category] || "bg-muted text-muted-foreground"}`}>
                                {product.category}
                              </span>
                              <span className="text-xs font-medium inline-flex items-center gap-1">
                                <Star className="w-3 h-3 text-accent fill-accent" />
                                {product.rating}
                              </span>
                            </div>

                            <h4 className="text-sm font-semibold line-clamp-1">{product.name}</h4>
                            <p className="text-xs text-muted-foreground">{product.sku}</p>

                            <div className="pt-1 flex items-end justify-between">
                              <div>
                                <p className="text-[11px] text-muted-foreground">Wholesale</p>
                                <p className="text-base font-bold">₹{product.wholesalePrice}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] text-muted-foreground">Stock</p>
                                <p className={`text-sm font-semibold ${product.stock < 20 ? "text-destructive" : "text-success"}`}>
                                  {product.stock.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2 h-8 w-8" />
                  <CarouselNext className="right-2 h-8 w-8" />
                </Carousel>
              </div>
            ))}
          </div>
        )}

        {isDashboardLoading && <p className="text-sm text-muted-foreground mt-4">Loading dashboard...</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold font-display mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/buyer/products">Browse Products</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/buyer/orders">Track Orders</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/buyer/reviews">Give Reviews</Link>
            </Button>
            <Button asChild className="justify-start">
              <Link to="/buyer/products">Place New Order</Link>
            </Button>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold font-display mb-3">Smart Suggestions</h3>
          <div className="space-y-3">
            {reorderSuggestions.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Frequent Orders</p>
                <div className="space-y-2">
                  {reorderSuggestions.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                      </div>
                      <span className="text-xs font-semibold text-primary">{item.quantity} units</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              !isOrdersLoading && <p className="text-sm text-muted-foreground">Place a few orders to get reorder suggestions.</p>
            )}

            {lowStockOpportunities.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Order Soon</p>
                <div className="space-y-2">
                  {lowStockOpportunities.map((product) => (
                    <div key={product._id} className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-2.5">
                      <p className="text-sm font-medium">{product.name}</p>
                      <span className="text-xs font-semibold text-warning">{product.stock} left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
