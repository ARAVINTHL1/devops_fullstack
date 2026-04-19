import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, Briefcase } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth-context";
import {
  createEmployeeApi,
  getEmployeesApi,
  type Employee,
  type NewEmployeePayload,
} from "@/lib/admin-api";

const EMPTY_FORM: NewEmployeePayload = {
  name: "",
  email: "",
  password: "",
  department: "",
  phone: "",
};

const AdminUserManagement = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<NewEmployeePayload>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEmployees = async () => {
      if (!token) return;

      try {
        const response = await getEmployeesApi(token);
        setEmployees(response.employees);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load employees.";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadEmployees();
  }, [token]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;

    return employees.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        (employee.department ?? "").toLowerCase().includes(query)
      );
    });
  }, [employees, search]);

  const handleInputChange = (field: keyof NewEmployeePayload, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
  };

  const handleCreateEmployee = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error("Authentication required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createEmployeeApi(token, formData);
      setEmployees((previous) => [response.employee, ...previous]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success(`Employee account created for ${response.employee.name}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create employee account.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Employee Management</h1>
          <p className="text-muted-foreground">Add and manage employee access credentials</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">Loading employees...</div>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Employee</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Department</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-xs font-bold text-info">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{employee.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{employee.department ?? "-"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{employee.phone ?? "-"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{employee.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize ${employee.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{employee.lastLogin ?? "Never"}</td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>
              All fields are required. Email must be unique and password is used for employee login.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name">Full Name</Label>
              <Input
                id="employee-name"
                value={formData.name}
                onChange={(event) => handleInputChange("name", event.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-department">Department</Label>
              <Input
                id="employee-department"
                value={formData.department}
                onChange={(event) => handleInputChange("department", event.target.value)}
                placeholder="Example: Operations"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-phone">Phone Number</Label>
              <Input
                id="employee-phone"
                value={formData.phone}
                onChange={(event) => handleInputChange("phone", event.target.value)}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-email">Email</Label>
              <Input
                id="employee-email"
                type="email"
                value={formData.email}
                onChange={(event) => handleInputChange("email", event.target.value)}
                placeholder="employee@msgarments.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-password">Password</Label>
              <Input
                id="employee-password"
                type="password"
                value={formData.password}
                onChange={(event) => handleInputChange("password", event.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
