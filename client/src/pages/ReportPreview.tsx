import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, Download, FileText } from "lucide-react";

export default function ReportPreview() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/reports/:id");
  const reportId = params?.id ? parseInt(params.id) : null;

  // Get report
  const { data: report } = trpc.report.getReportById.useQuery(reportId || 0, {
    enabled: !!reportId && !!user,
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-secondary border-t-primary rounded-full" />
        </div>
      </div>
    );
  }

  const COLORS = ["#4CAF50", "#D4AF37", "#3E2723", "#8B6F47", "#F44336", "#81C784", "#FFD54F", "#5D4037"];

  // Parse report data
  const encaissementsData = report.encaissementsBreakdown ? JSON.parse(report.encaissementsBreakdown as any) : {};
  const decaissementsData = report.decaissementsBreakdown ? JSON.parse(report.decaissementsBreakdown as any) : {};

  const encaissementsPie = Object.entries(encaissementsData).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  const decaissementsPie = Object.entries(decaissementsData).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  return (
    <DashboardLayout title="Prévisualisation Rapport" description={`Rapport du ${new Date(report.startDate).toLocaleDateString('fr-FR')}`}>
      <div className="space-y-6">
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/admin/reports")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Button
            onClick={() => setLocation(`/admin/reports/${reportId}/download`)}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
        </div>

        {/* Report Header */}
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">Rapport Financier</h1>
            <p className="text-lg text-muted-foreground">Période: {new Date(report.startDate).toLocaleDateString('fr-FR')} - {new Date(report.endDate).toLocaleDateString('fr-FR')}</p>
            <p className="text-sm text-muted-foreground">Généré le {formatDate(report.createdAt)}</p>
          </div>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Encaissements</p>
            <p className="text-3xl font-bold mt-2 text-success">
              {formatCurrency(parseFloat(report.totalEncaissements))}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Décaissements</p>
            <p className="text-3xl font-bold mt-2 text-destructive">
              {formatCurrency(parseFloat(report.totalDecaissements))}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Solde Final</p>
            <p className={`text-3xl font-bold mt-2 ${parseFloat(report.finalBalance) >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(parseFloat(report.finalBalance))}
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {encaissementsPie.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Répartition Encaissements</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={encaissementsPie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {encaissementsPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {decaissementsPie.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Répartition Décaissements</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={decaissementsPie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {decaissementsPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* AI Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Analyse IA</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground whitespace-pre-wrap">
              {(report as any).aiAnalysis || "Analyse en attente de génération..."}
            </p>
          </div>
        </Card>

        {/* Momentum Analysis */}
        {(report as any).momentumAnalysis && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Analyse des Pics d'Activité</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-wrap">
                {(report as any).momentumAnalysis}
              </p>
            </div>
          </Card>
        )}

        {/* Personalized Recommendations */}
        {(report as any).personalizedRecommendations && (
          <Card className="p-6 bg-secondary/5 border border-secondary/20">
            <h3 className="text-lg font-semibold text-foreground mb-4">💡 Recommandations Personnalisées</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-wrap">
                {(report as any).personalizedRecommendations}
              </p>
            </div>
          </Card>
        )}

        {/* Export Options */}
        <Card className="p-6 bg-primary/5 border border-primary/20">
          <h3 className="text-lg font-semibold text-foreground mb-4">Options d'Export</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setLocation(`/admin/reports/${reportId}/download?format=pdf`)}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <FileText className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
            <Button
              onClick={() => setLocation(`/admin/reports/${reportId}/download?format=excel`)}
              className="flex-1 bg-success hover:bg-success/90"
            >
              <FileText className="w-4 h-4 mr-2" />
              Télécharger Excel
            </Button>
            <Button
              onClick={() => setLocation(`/admin/reports/${reportId}/download?format=word`)}
              className="flex-1 bg-secondary hover:bg-secondary/90"
            >
              <FileText className="w-4 h-4 mr-2" />
              Télécharger Word
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
