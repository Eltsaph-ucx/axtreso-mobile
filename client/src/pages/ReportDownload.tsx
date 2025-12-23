import { useEffect, useState } from "react";
import { useLocation, useRoute, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function ReportDownload() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/reports/:id/download");
  const search = useSearch();
  const reportId = params?.id ? parseInt(params.id) : null;
  const format = new URLSearchParams(search).get("format") || "pdf";

  // Get report
  const { data: report } = trpc.report.getReportById.useQuery(reportId || 0, {
    enabled: !!reportId && !!user,
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (report) {
      // Simulate download based on format
      const fileName = `rapport-${report.id}-${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : format === "word" ? "docx" : "pdf"}`;

      // Create a blob with sample content
      const content = `
RAPPORT FINANCIER
================

Période: ${new Date(report.startDate).toLocaleDateString("fr-FR")} - ${new Date(report.endDate).toLocaleDateString("fr-FR")}
Généré le: ${new Date(report.createdAt).toLocaleDateString("fr-FR")}

RÉSUMÉ FINANCIER
================
Total Encaissements: ${report.totalEncaissements} FCFA
Total Décaissements: ${report.totalDecaissements} FCFA
Solde Final: ${report.finalBalance} FCFA

DÉTAILS
=======
[Détails des transactions et analyses]

Analyse IA: ${(report as any).aiAnalysis || "À générer"}
Recommandations: ${(report as any).personalizedRecommendations || "À générer"}
      `;

      const blob = new Blob([content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Rapport téléchargé en ${format.toUpperCase()}`);
      setTimeout(() => setLocation("/admin/reports"), 1000);
    }
  }, [report, format, setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-secondary border-t-primary rounded-full mx-auto" />
        </div>
        <p className="text-foreground">Téléchargement du rapport en {format.toUpperCase()}...</p>
      </div>
    </div>
  );
}
