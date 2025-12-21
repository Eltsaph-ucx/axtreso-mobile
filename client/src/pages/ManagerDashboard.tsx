import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Plus, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function ManagerDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [salonId, setSalonId] = useState<number | null>(null);

  // Get manager's salon
  const { data: salon } = trpc.salon.getMysalon.useQuery(undefined, {
    enabled: !!user && user.role === "manager",
  });

  // Get transactions for current month
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const { data: monthTransactions = [] } = trpc.transaction.getBySalon.useQuery(
    {
      salonId: salonId || 0,
      startDate: monthStart,
      endDate: monthEnd,
    },
    { enabled: !!salonId }
  );

  // Get transactions for last 10 days
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const { data: tenDaysTransactions = [] } = trpc.transaction.getBySalon.useQuery(
    {
      salonId: salonId || 0,
      startDate: tenDaysAgo,
      endDate: today,
    },
    { enabled: !!salonId }
  );

  // Get today's transactions
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const { data: todayTransactions = [] } = trpc.transaction.getBySalon.useQuery(
    {
      salonId: salonId || 0,
      startDate: todayStart,
      endDate: todayEnd,
    },
    { enabled: !!salonId }
  );

  useEffect(() => {
    if (salon) {
      setSalonId(salon.id);
    }
  }, [salon]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "manager")) {
      setLocation("/manager/login");
    }
  }, [user, loading, setLocation]);

  // Calculate statistics
  const calculateStats = (transactions: any[]) => {
    const encaissements = transactions
      .filter(t => t.type === "encaissement")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const decaissements = transactions
      .filter(t => t.type === "decaissement")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return { encaissements, decaissements, balance: encaissements - decaissements };
  };

  const todayStats = calculateStats(todayTransactions);
  const monthStats = calculateStats(monthTransactions);

  // Prepare chart data for last 10 days
  const chartData = Array.from({ length: 11 }, (_, i) => {
    const date = new Date(tenDaysAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });

    const dayTransactions = tenDaysTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.toDateString() === date.toDateString();
    });

    const stats = calculateStats(dayTransactions);
    return {
      date: dateStr,
      encaissements: stats.encaissements,
      decaissements: stats.decaissements,
      balance: stats.balance,
    };
  });

  // Breakdown by designation for pie chart
  const encaissementsBreakdown = monthTransactions
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
    <DashboardLayout title={`Dashboard - ${salon?.name || "Salon"}`} description={`${salon?.city || ""}`}>
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setLocation("/manager/transactions?action=add-encaissement")}
            className="bg-success hover:bg-success/90 text-white flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Encaissement
          </Button>
          <Button
            onClick={() => setLocation("/manager/transactions?action=add-decaissement")}
            className="bg-destructive hover:bg-destructive/90 text-white flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Décaissement
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Balance */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Solde Aujourd'hui</p>
                <p className={`text-3xl font-bold mt-2 ${todayStats.balance >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(todayStats.balance)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${todayStats.balance >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                {todayStats.balance >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-success" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-destructive" />
                )}
              </div>
            </div>
          </Card>

          {/* Month's Balance */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Solde Mois</p>
                <p className={`text-3xl font-bold mt-2 ${monthStats.balance >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(monthStats.balance)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${monthStats.balance >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                <Calendar className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </Card>

          {/* Today's Encaissements */}
          <Card className="p-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Encaissements (Jour)</p>
              <p className="text-3xl font-bold mt-2 text-success">{formatCurrency(todayStats.encaissements)}</p>
            </div>
          </Card>

          {/* Today's Decaissements */}
          <Card className="p-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Décaissements (Jour)</p>
              <p className="text-3xl font-bold mt-2 text-destructive">{formatCurrency(todayStats.decaissements)}</p>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 10 Days Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Évolution 10 Derniers Jours</h3>
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

          {/* Encaissements Breakdown */}
          {pieData.length > 0 ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Répartition Encaissements (Mois)</h3>
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
              <p className="text-muted-foreground">Aucune donnée pour ce mois</p>
            </Card>
          )}
        </div>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Transactions Récentes</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/manager/transactions")}
            >
              Voir Tout
            </Button>
          </div>

          {monthTransactions.length > 0 ? (
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
                  {monthTransactions.slice(0, 5).map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3">{new Date(transaction.date).toLocaleDateString("fr-FR")}</td>
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
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune transaction ce mois-ci</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
