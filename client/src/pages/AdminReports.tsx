import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Download, Eye, Trash2, Loader2, FileText } from "lucide-react";

export default function AdminReports() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSalonId, setSelectedSalonId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  // Get all salons
  const { data: salons = [] } = trpc.salon.getAllSalons.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  // Get reports
  const { data: reports = [], refetch } = trpc.report.getReportsBySalon.useQuery(
    selectedSalonId ? parseInt(selectedSalonId) : 0,
    { enabled: !!user && user.role === "admin" && !!selectedSalonId }
  );

  // Placeholder mutation for report generation
  // This would be replaced with actual AI-powered report generation
  const generateReportMutation = {
    mutate: (data: any) => {
      toast.info("Génération de rapport - Fonctionnalité à implémenter avec IA");
    },
    isPending: false,
  } as any;

  const _generateReportMutation = trpc.report.getReportsBySalon.useQuery(
    selectedSalonId ? parseInt(selectedSalonId) : 0,
    { enabled: false }
  );

  const generateReportMutationOld = {
    onSuccess: () => {
      toast.success("Rapport généré avec succès");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  };

  const deleteReportMutation = trpc.report.deleteReport.useMutation({
    onSuccess: () => {
      toast.success("Rapport supprimé");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleGenerateReport = () => {
    if (!selectedSalonId) {
      toast.error("Veuillez sélectionner un salon");
      return;
    }

    toast.info("Génération de rapport - Fonctionnalité à implémenter avec IA et exports");
  };

  const handleDeleteReport = (reportId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rapport?")) {
      deleteReportMutation.mutate(reportId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-secondary border-t-primary rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Génération de Rapports" description="Générez des rapports détaillés avec analyses IA">
      <div className="space-y-6">
        {/* Report Generation Form */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Générer un Nouveau Rapport</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Salon Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Salon *</label>
              <Select value={selectedSalonId} onValueChange={setSelectedSalonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un salon" />
                </SelectTrigger>
                <SelectContent>
                  {salons.map(salon => (
                    <SelectItem key={salon.id} value={salon.id.toString()}>
                      {salon.name} ({salon.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mois *</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <Button
                onClick={handleGenerateReport}
                disabled={generateReportMutation.isPending || !selectedSalonId}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {generateReportMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Générer Rapport
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Reports List */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Rapports Générés ({reports.length})
          </h3>

          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Salon</th>
                    <th className="px-4 py-3 text-left font-semibold">Période</th>
                    <th className="px-4 py-3 text-left font-semibold">Solde</th>
                    <th className="px-4 py-3 text-left font-semibold">Généré le</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report: any) => {
                    const salon = salons.find(s => s.id === report.salonId);
                    return (
                      <tr key={report.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{salon?.name || "Salon"}</td>
                        <td className="px-4 py-3">{report.month}</td>
                        <td className={`px-4 py-3 font-semibold ${
                          parseFloat(report.balance) >= 0 ? "text-success" : "text-destructive"
                        }`}>
                          {formatCurrency(parseFloat(report.balance))}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/admin/reports/${report.id}`)}
                              className="h-8 w-8 p-0"
                              title="Prévisualiser"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/admin/reports/${report.id}/download`)}
                              className="h-8 w-8 p-0"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              disabled={deleteReportMutation.isPending}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucun rapport généré</p>
              <p className="text-sm text-muted-foreground">
                Sélectionnez un salon et un mois pour générer un rapport
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
