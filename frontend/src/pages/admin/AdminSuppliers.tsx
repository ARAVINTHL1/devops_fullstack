import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, Plus, Star, TruckIcon, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPurchaseOrderApi,
  createSupplierApi,
  getPurchaseOrdersApi,
  getSuppliersApi,
  type NewPurchaseOrderPayload,
  type NewSupplierPayload,
  type Supplier,
} from "@/lib/admin-api";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EMPTY_SUPPLIER_FORM = {
  name: "",
  location: "",
  rating: "",
  defectRate: "",
  totalOrders: "",
  status: "active" as "active" | "inactive",
};

const EMPTY_PO_FORM = {
  itemName: "",
  quantity: "",
  unitCost: "",
  expectedDelivery: "",
  notes: "",
};

const AdminSuppliers = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPoOpen, setIsPoOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState(EMPTY_SUPPLIER_FORM);
  const [poForm, setPoForm] = useState(EMPTY_PO_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: () => getSuppliersApi(token ?? ""),
    enabled: !!token,
  });

  const suppliers = data?.suppliers ?? [];
  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const { data: poData, isLoading: isPoLoading } = useQuery({
    queryKey: ["supplier-pos", selectedSupplier?._id],
    queryFn: () => getPurchaseOrdersApi(token ?? "", selectedSupplier?._id),
    enabled: !!token && !!selectedSupplier?._id && (isDetailsOpen || isPoOpen),
  });

  const purchaseOrders = poData?.purchaseOrders ?? [];

  const createSupplierMutation = useMutation({
    mutationFn: async (payload: NewSupplierPayload) => {
      if (!token) throw new Error("Authentication required.");
      return createSupplierApi(token, payload);
    },
    onSuccess: () => {
      toast.success("Supplier added successfully.");
      setIsAddOpen(false);
      setForm(EMPTY_SUPPLIER_FORM);
      void queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to add supplier.";
      toast.error(message);
    },
  });

  const createPoMutation = useMutation({
    mutationFn: async (payload: NewPurchaseOrderPayload) => {
      if (!token) throw new Error("Authentication required.");
      return createPurchaseOrderApi(token, payload);
    },
    onSuccess: () => {
      toast.success("Purchase order created successfully.");
      setIsPoOpen(false);
      setPoForm(EMPTY_PO_FORM);
      void queryClient.invalidateQueries({ queryKey: ["supplier-pos", selectedSupplier?._id] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to create purchase order.";
      toast.error(message);
    },
  });

  const updateForm = (field: keyof typeof EMPTY_SUPPLIER_FORM, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updatePoForm = (field: keyof typeof EMPTY_PO_FORM, value: string) => {
    setPoForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleAddSupplier = (event: React.FormEvent) => {
    event.preventDefault();

    const payload: NewSupplierPayload = {
      name: form.name.trim(),
      location: form.location.trim(),
      rating: Number(form.rating),
      defectRate: Number(form.defectRate),
      totalOrders: Number(form.totalOrders),
      status: form.status,
    };

    if (!payload.name || !payload.location) {
      toast.error("Name and location are required.");
      return;
    }

    if (
      Number.isNaN(payload.rating) ||
      Number.isNaN(payload.defectRate) ||
      Number.isNaN(payload.totalOrders)
    ) {
      toast.error("Rating, defect rate and total orders must be valid numbers.");
      return;
    }

    createSupplierMutation.mutate(payload);
  };

  const handleCreatePo = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedSupplier) {
      toast.error("Select a supplier first.");
      return;
    }

    const payload: NewPurchaseOrderPayload = {
      supplierId: selectedSupplier._id,
      itemName: poForm.itemName.trim(),
      quantity: Number(poForm.quantity),
      unitCost: Number(poForm.unitCost),
      expectedDelivery: poForm.expectedDelivery,
      notes: poForm.notes.trim(),
    };

    if (!payload.itemName || !payload.expectedDelivery) {
      toast.error("Item name and expected delivery date are required.");
      return;
    }

    if (Number.isNaN(payload.quantity) || Number.isNaN(payload.unitCost) || payload.quantity <= 0 || payload.unitCost < 0) {
      toast.error("Quantity and unit cost must be valid positive values.");
      return;
    }

    createPoMutation.mutate(payload);
  };

  const openDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDetailsOpen(true);
  };

  const openPo = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setPoForm(EMPTY_PO_FORM);
    setIsPoOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Suppliers</h1>
          <p className="text-muted-foreground">Manage your textile supply chain</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4" /> Add Supplier</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((supplier, i) => (
          <div key={supplier._id} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><TruckIcon className="w-6 h-6 text-primary" /></div>
                <div>
                  <h3 className="font-semibold font-display">{supplier.name}</h3>
                  <p className="text-xs text-muted-foreground">{supplier.location}</p>
                </div>
              </div>
              {supplier.status === "active" ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Inactive</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-1"><Star className="w-3 h-3 text-accent fill-accent" /><span className="text-sm font-bold">{supplier.rating}</span></div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Rating</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className={`text-sm font-bold ${supplier.defectRate > 2 ? "text-destructive" : "text-success"}`}>{supplier.defectRate}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Defect Rate</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold">{supplier.totalOrders}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Orders</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openDetails(supplier)}>View Details</Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openPo(supplier)}>New PO</Button>
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && <p className="text-sm text-muted-foreground">No suppliers found.</p>}
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
            <DialogDescription>Supplier profile and recent purchase orders.</DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-md bg-muted/50"><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{selectedSupplier.name}</p></div>
                <div className="p-3 rounded-md bg-muted/50"><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{selectedSupplier.location}</p></div>
                <div className="p-3 rounded-md bg-muted/50"><p className="text-xs text-muted-foreground">Rating</p><p className="font-medium">{selectedSupplier.rating}</p></div>
                <div className="p-3 rounded-md bg-muted/50"><p className="text-xs text-muted-foreground">Defect Rate</p><p className="font-medium">{selectedSupplier.defectRate}%</p></div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Recent Purchase Orders</h4>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {purchaseOrders.map((po) => (
                    <div key={po.id} className="p-3 rounded-md border border-border text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{po.poNumber}</p>
                        <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary">{po.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{po.itemName} - Qty {po.quantity}</p>
                      <p className="text-xs text-muted-foreground">ETA {po.expectedDelivery}</p>
                    </div>
                  ))}
                  {!isPoLoading && purchaseOrders.length === 0 && <p className="text-xs text-muted-foreground">No purchase orders yet.</p>}
                  {isPoLoading && <p className="text-xs text-muted-foreground">Loading purchase orders...</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPoOpen} onOpenChange={setIsPoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
            <DialogDescription>Create a PO for {selectedSupplier?.name ?? "supplier"}.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreatePo}>
            <div className="space-y-2">
              <Label htmlFor="po-item">Item Name</Label>
              <Input id="po-item" value={poForm.itemName} onChange={(e) => updatePoForm("itemName", e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="po-quantity">Quantity</Label>
                <Input id="po-quantity" type="number" min="1" value={poForm.quantity} onChange={(e) => updatePoForm("quantity", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="po-cost">Unit Cost</Label>
                <Input id="po-cost" type="number" min="0" step="0.01" value={poForm.unitCost} onChange={(e) => updatePoForm("unitCost", e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="po-delivery">Expected Delivery</Label>
              <Input id="po-delivery" type="date" value={poForm.expectedDelivery} onChange={(e) => updatePoForm("expectedDelivery", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="po-notes">Notes</Label>
              <Input id="po-notes" value={poForm.notes} onChange={(e) => updatePoForm("notes", e.target.value)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPoOpen(false)} disabled={createPoMutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={createPoMutation.isPending}>{createPoMutation.isPending ? "Creating..." : "Create PO"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Add a new supplier and it will appear in the list.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleAddSupplier}>
            <div className="space-y-2">
              <Label htmlFor="supplier-name">Supplier Name</Label>
              <Input id="supplier-name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-location">Location</Label>
              <Input id="supplier-location" value={form.location} onChange={(e) => updateForm("location", e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="supplier-rating">Rating (0-5)</Label>
                <Input id="supplier-rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => updateForm("rating", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-defect">Defect Rate (%)</Label>
                <Input id="supplier-defect" type="number" min="0" step="0.1" value={form.defectRate} onChange={(e) => updateForm("defectRate", e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="supplier-orders">Total Orders</Label>
                <Input id="supplier-orders" type="number" min="0" value={form.totalOrders} onChange={(e) => updateForm("totalOrders", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-status">Status</Label>
                <select
                  id="supplier-status"
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setForm(EMPTY_SUPPLIER_FORM);
                }}
                disabled={createSupplierMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSupplierMutation.isPending}>
                {createSupplierMutation.isPending ? "Adding..." : "Add Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSuppliers;
