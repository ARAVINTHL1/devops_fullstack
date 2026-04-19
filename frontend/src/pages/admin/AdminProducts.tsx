import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Package, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProductApi, getProductsApi, type NewProductPayload } from "@/lib/admin-api";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORIES = ["All", "Fabrics", "Garments", "Threads", "Dyes", "Accessories"];

const EMPTY_PRODUCT_FORM = {
  sku: "",
  name: "",
  category: "Fabrics",
  description: "",
  costPrice: "",
  wholesalePrice: "",
  stock: "",
  rating: "",
  batchNumber: "",
};

const AdminProducts = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);
  const [imageDataUrl, setImageDataUrl] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getProductsApi(token ?? ""),
    enabled: !!token,
  });

  const createProductMutation = useMutation({
    mutationFn: async (payload: NewProductPayload) => {
      if (!token) throw new Error("Authentication required.");
      return createProductApi(token, payload);
    },
    onSuccess: () => {
      toast.success("Product added successfully.");
      setIsAddOpen(false);
      setForm(EMPTY_PRODUCT_FORM);
      setImageDataUrl("");
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to add product.";
      toast.error(message);
    },
  });

  const products = data?.products ?? [];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const categoryColor: Record<string, string> = {
    Fabrics: "bg-primary/10 text-primary",
    Garments: "bg-accent/10 text-accent-foreground",
    Threads: "bg-success/10 text-success",
    Dyes: "bg-info/10 text-info",
    Accessories: "bg-warning/10 text-warning",
  };

  const updateForm = (field: keyof typeof EMPTY_PRODUCT_FORM, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleAddProduct = (event: React.FormEvent) => {
    event.preventDefault();

    const payload: NewProductPayload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      costPrice: Number(form.costPrice),
      wholesalePrice: Number(form.wholesalePrice),
      stock: Number(form.stock),
      rating: form.rating ? Number(form.rating) : 0,
      batchNumber: form.batchNumber.trim(),
      image: imageDataUrl,
    };

    if (!payload.sku || !payload.name || !payload.category) {
      toast.error("SKU, name and category are required.");
      return;
    }

    if (
      Number.isNaN(payload.costPrice) ||
      Number.isNaN(payload.wholesalePrice) ||
      Number.isNaN(payload.stock)
    ) {
      toast.error("Cost, wholesale price and stock must be valid numbers.");
      return;
    }

    createProductMutation.mutate(payload);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImageDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Products</h1>
          <p className="text-muted-foreground">{filtered.length} products in catalog</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4" /> Add Product</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {isLoading && <p className="text-sm text-muted-foreground">Loading products...</p>}
        {filtered.map((product, i) => (
          <div key={product._id} className="stat-card group overflow-hidden" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="h-40 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-secondary/80 transition-colors overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-contain rounded-lg bg-white" />
              ) : (
                <Package className="w-12 h-12 text-muted-foreground/40" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColor[product.category] || ""}`}>{product.category}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-accent fill-accent" />
                  <span className="text-xs font-medium">{product.rating}</span>
                </div>
              </div>
              <h3 className="font-semibold font-display text-sm leading-tight">{product.name}</h3>
              <p className="text-xs text-muted-foreground">{product.sku}</p>
              <div className="flex items-end justify-between pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Wholesale</p>
                  <p className="text-lg font-bold font-display">₹{product.wholesalePrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Stock</p>
                  <p className={`text-sm font-semibold ${product.stock < 20 ? "text-destructive" : "text-success"}`}>{product.stock.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && <p className="text-sm text-muted-foreground">No products found.</p>}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Add a new product to the catalog.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleAddProduct}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku} onChange={(e) => updateForm("sku", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch">Batch Number</Label>
                <Input id="batch" value={form.batchNumber} onChange={(e) => updateForm("batchNumber", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORIES.filter((category) => category !== "All").map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(e) => updateForm("description", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost Price</Label>
                <Input id="cost" type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => updateForm("costPrice", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wholesale">Wholesale Price</Label>
                <Input id="wholesale" type="number" min="0" step="0.01" value={form.wholesalePrice} onChange={(e) => updateForm("wholesalePrice", e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => updateForm("stock", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input id="rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => updateForm("rating", e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setForm(EMPTY_PRODUCT_FORM);
                  setImageDataUrl("");
                }}
                disabled={createProductMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProductMutation.isPending}>
                {createProductMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
