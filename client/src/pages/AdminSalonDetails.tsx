import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft } from "lucide-react";

export default function AdminSalonDetails() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/salons/:id");
  const salonId = params?.id ? parseInt(params.id) : null;

  // Get all salons
  const { data: salons = [] } = trpc.salon.getAllSalons.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const salon = salons.find(s => s.id === salonId);

  // Get transactions for this salon
  const { data: transactions = [] } = trpc.transaction.getBySalon.useQuery(
    { salonId: salonId || 0 },
    { enabled: !!salonId }
  );

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading || !salon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-secondary border-t-primary rounded-full" />
        </div>
      </div>
    );
  }

  // Calculate statistics
  const encaissements = transactions
    .filter(t => t.type === "encaissement")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const decaissements = transactions
    .filter(t => t.type === "decaissement")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const balance = encaissements - decaissements;

  // Prepare chart data for 30 days
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (30 - i));
    const dateStr = date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });

    const dayTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.toDateString() === date.toDateString();
    });

    const dayEncaissements = dayTransactions
      .filter(t => t.type === "encaissement")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const dayDecaissements = dayTransactions
      .filter(t => t.type === "decaissement")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      date: dateStr,
      encaissements: dayEncaissements,
      decaissements: dayDecaissements,
    };
  });

  // Breakdown by designation
  const encaissementsBreakdown = transactions
    .filter(t => t.type === "encaissement")
    .reduce((acc: Record<string, number>, t) => {
      acc[t.designation] = (acc[t.designation] || 0) + parseFloat(t.amount);
      return acc;
    }, {});

  const pieData = Object.entries(encaissementsBreakdown).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  const COLORS = ["#4CAF50", "#D4AF37", "#3E2723", "#8B6F47", "#F44336", "#81C784", "#FFD54F", "#5D4037"];

  return (
    <DashboardLayout title={salon.name} description={`${salon.city} - Détails du salon`}>
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/admin/salons")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux Salons
        </Button>

        {/* Salon Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Informations du Salon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="text-lg font-semibold text-foreground mt-1">{salon.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ville</p>
              <p className="text-lg font-semibold text-foreground mt-1">{salon.city}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg font-semibold text-foreground mt-1">{salon.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="text-lg font-semibold text-foreground mt-1">{salon.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className={`text-lg font-semibold mt-1 ${salon.status === "active" ? "text-success" : "text-destructive"}`}>
                {salon.status === "active" ? "Actif" : "Inactif"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Création</p>
              <p className="text-lg font-semibold text-foreground mt-1">{formatDate(salon.createdAt)}</p>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Encaissements</p>
            <p className="text-3xl font-bold mt-2 text-success">{formatCurrency(encaissements)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Décaissements</p>
            <p className="text-3xl font-bold mt-2 text-destructive">{formatCurrency(decaissements)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Solde Net</p>
            <p className={`text-3xl font-bold mt-2 ${balance >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(balance)}
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 30 Days Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Évolution 30 Jours</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
                <Bar dataKey="encaissements" fill="#4CAF50" name="Encaissements" />
                <Bar dataKey="decaissements" fill="#F44336" name="Décaissements" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Breakdown */}
          {pieData.length > 0 ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Répartition Encaissements</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <Card className="p-6 flex items-center justify-center">
              <p className="text-muted-foreground">Aucune donnée disponible</p>
            </Card>
          )}
        </div>

        {/* Recent Transactions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Transactions Récentes</h3>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Désignation</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3">{formatDate(transaction.date)}</td>
                      <td className="px-4 py-3">{transaction.designation}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.type === "encaissement"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {transaction.type === "encaissement" ? "Encaissement" : "Décaissement"}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        transaction.type === "encaissement" ? "text-success" : "text-destructive"
                      }`}>
                        {formatCurrency(parseFloat(transaction.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucune transaction</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
