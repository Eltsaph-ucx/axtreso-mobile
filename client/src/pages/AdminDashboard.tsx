import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Users, TrendingUp, Activity, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Get all salons
  const { data: salons = [] } = trpc.salon.getAllSalons.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Calculate statistics
  const activeSalons = salons.filter(s => s.status === "active").length;
  const inactiveSalons = salons.filter(s => s.status === "inactive").length;
  const totalSalons = salons.length;

  // Prepare chart data for each salon (30 days trend - placeholder)
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (30 - i));
    return {
      date: date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
      balance: Math.random() * 500000 + 100000,
    };
  });

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
    <DashboardLayout title="Dashboard Administrateur" description="Vue d'ensemble de tous les salons">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Salons */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Salons</p>
                <p className="text-3xl font-bold mt-2 text-primary">{totalSalons}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          {/* Active Salons */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Salons Actifs</p>
                <p className="text-3xl font-bold mt-2 text-success">{activeSalons}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-success" />
              </div>
            </div>
          </Card>

          {/* Inactive Salons */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Salons Inactifs</p>
                <p className="text-3xl font-bold mt-2 text-destructive">{inactiveSalons}</p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </Card>

          {/* Taux Activation */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Taux Activation</p>
                <p className="text-3xl font-bold mt-2 text-secondary">
                  {totalSalons > 0 ? Math.round((activeSalons / totalSalons) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Évolution Globale (30 Jours)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
                formatter={(value) => formatCurrency(value as number)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="var(--primary)"
                strokeWidth={2}
                name="Solde Moyen"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Salons Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Gestion des Salons</h3>
            <Button
              onClick={() => setLocation("/admin/salons")}
              className="bg-primary hover:bg-primary/90"
            >
              Voir Tous les Salons
            </Button>
          </div>

          {salons.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Nom</th>
                    <th className="px-4 py-3 text-left font-semibold">Ville</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Statut</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salons.slice(0, 5).map((salon) => (
                    <tr key={salon.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{salon.name}</td>
                      <td className="px-4 py-3">{salon.city}</td>
                      <td className="px-4 py-3 text-muted-foreground">{salon.email || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          salon.status === "active"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {salon.status === "active" ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/admin/salons/${salon.id}`)}
                        >
                          Détails
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucun salon enregistré</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
