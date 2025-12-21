import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Search, Filter } from "lucide-react";

export default function ManagerTransactions() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [salonId, setSalonId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    type: "all" as "all" | "encaissement" | "decaissement",
    search: "",
  });

  // Get manager's salon
  const { data: salon } = trpc.salon.getMysalon.useQuery(undefined, {
    enabled: !!user && user.role === "manager",
  });

  // Get transactions
  const { data: transactions = [], refetch } = trpc.transaction.getBySalon.useQuery(
    {
      salonId: salonId || 0,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      type: filters.type !== "all" ? filters.type : undefined,
      search: filters.search || undefined,
    },
    { enabled: !!salonId }
  );

  const deleteTransaction = trpc.transaction.delete.useMutation({
    onSuccess: () => {
      toast.success("Transaction supprimée");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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

  const handleDelete = (transactionId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette transaction?")) {
      deleteTransaction.mutate({
        transactionId,
        salonId: salonId || 0,
      });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
    <DashboardLayout title="Transactions" description="Gérez vos encaissements et décaissements">
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setLocation("/manager/transactions/add?type=encaissement")}
            className="bg-success hover:bg-success/90 text-white flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Encaissement
          </Button>
          <Button
            onClick={() => setLocation("/manager/transactions/add?type=decaissement")}
            className="bg-destructive hover:bg-destructive/90 text-white flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Décaissement
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-secondary" />
            <h3 className="font-semibold text-foreground">Filtres</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Start */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date Début</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>

            {/* Date End */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date Fin</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="encaissement">Encaissements</SelectItem>
                  <SelectItem value="decaissement">Décaissements</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Transactions ({transactions.length})
          </h3>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Désignation</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">Montant</th>
                    <th className="px-4 py-3 text-left font-semibold">Commentaire</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3">{formatDate(transaction.date)}</td>
                      <td className="px-4 py-3 font-medium">{transaction.designation}</td>
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
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {transaction.comment || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/manager/transactions/${transaction.id}/edit`)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled={deleteTransaction.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucune transaction trouvée</p>
              <Button
                onClick={() => setLocation("/manager/transactions/add?type=encaissement")}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une Transaction
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
