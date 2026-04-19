import { Brain, Upload, Camera, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getQualityInspectionsApi } from "@/lib/admin-api";

const AdminQuality = () => {
  const { token } = useAuth();
  const [dragActive, setDragActive] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-quality-inspections"],
    queryFn: () => getQualityInspectionsApi(token ?? ""),
    enabled: !!token,
  });

  const inspections = data?.inspections ?? [];

  const statusIcon: Record<string, React.ReactNode> = {
    passed: <CheckCircle className="w-5 h-5 text-success" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning" />,
    flagged: <XCircle className="w-5 h-5 text-destructive" />,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Quality Inspection</h1>
        <p className="text-muted-foreground">AI-powered fabric defect detection</p>
      </div>

      <div className={`stat-card border-2 border-dashed transition-colors text-center py-12 ${dragActive ? "border-accent bg-accent/5" : "border-border"}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={() => setDragActive(false)}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><Brain className="w-8 h-8 text-primary" /></div>
          <div>
            <h3 className="font-semibold font-display text-lg">Upload Fabric Image for Inspection</h3>
            <p className="text-sm text-muted-foreground mt-1">Drag & drop or click to upload. CNN model detects holes, stains, misweaves & more.</p>
          </div>
          <div className="flex gap-3">
            <Button className="gap-2"><Upload className="w-4 h-4" /> Upload Image</Button>
            <Button variant="outline" className="gap-2"><Camera className="w-4 h-4" /> Webcam Capture</Button>
          </div>
        </div>
      </div>

      <div className="stat-card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-border"><h3 className="font-semibold font-display">Recent Inspections</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Batch</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Product</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Defects</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Score</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((insp) => (
                <tr key={insp.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono">{insp.inspectionId}</td>
                  <td className="px-6 py-4 text-sm">{insp.batch}</td>
                  <td className="px-6 py-4 text-sm font-medium">{insp.product}</td>
                  <td className="px-6 py-4 text-sm">{insp.defects}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${insp.score >= 90 ? "bg-success" : insp.score >= 80 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${insp.score}%` }} />
                      </div>
                      <span className="text-xs font-medium">{insp.score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{statusIcon[insp.status]}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{insp.date}</td>
                </tr>
              ))}
              {!isLoading && inspections.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">No inspections found.</td>
                </tr>
              )}
            </tbody>
          </table>
          {isLoading && <div className="px-6 py-8 text-sm text-muted-foreground">Loading inspections...</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminQuality;
