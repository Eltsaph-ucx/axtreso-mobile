import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Search, ToggleLeft, ToggleRight, RotateCcw, Trash2, Eye } from "lucide-react";

export default function AdminSalons() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Get all salons
  const { data: salons = [], refetch } = trpc.salon.getAllSalons.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const toggleStatusMutation = trpc.salon.toggleSalonStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut du salon mis à jour");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetPasswordMutation = trpc.salon.resetSalonPassword.useMutation({
    onSuccess: () => {
      toast.success("Mot de passe réinitialisé avec succès");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteSalonMutation = trpc.salon.deleteSalon.useMutation({
    onSuccess: () => {
      toast.success("Salon supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  const handleToggleStatus = (salonId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    toggleStatusMutation.mutate({
      salonId,
      status: newStatus as "active" | "inactive",
    });
  };

  const handleResetPassword = (salonId: number) => {
    const newPassword = prompt("Entrez le nouveau mot de passe (minimum 8 caractères):");
    if (newPassword && newPassword.length >= 8) {
      resetPasswordMutation.mutate({
        salonId,
        newPassword,
      });
    } else if (newPassword) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
    }
  };

  const handleDeleteSalon = (salonId: number, salonName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le salon "${salonName}"? Cette action est irréversible.`)) {
      deleteSalonMutation.mutate(salonId);
    }
  };

  const filteredSalons = salons.filter(
    salon =>
      salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (salon.email && salon.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <DashboardLayout title="Gestion des Salons" description="Gérez tous les salons enregistrés">
      <div className="space-y-6">
        {/* Search Bar */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-secondary" />
            <h3 className="font-semibold text-foreground">Rechercher</h3>
          </div>
          <Input
            type="text"
            placeholder="Rechercher par nom, ville ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </Card>

        {/* Salons Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Salons ({filteredSalons.length})
          </h3>

          {filteredSalons.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Nom</th>
                    <th className="px-4 py-3 text-left font-semibold">Ville</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Téléphone</th>
                    <th className="px-4 py-3 text-left font-semibold">Statut</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalons.map((salon) => (
                    <tr key={salon.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{salon.name}</td>
                      <td className="px-4 py-3">{salon.city}</td>
                      <td className="px-4 py-3 text-muted-foreground">{salon.email || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{salon.phone || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          salon.status === "active"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {salon.status === "active" ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/admin/salons/${salon.id}`)}
                            className="h-8 w-8 p-0"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Toggle Status */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(salon.id, salon.status)}
                            className="h-8 w-8 p-0"
                            disabled={toggleStatusMutation.isPending}
                            title={salon.status === "active" ? "Désactiver" : "Activer"}
                          >
                            {salon.status === "active" ? (
                              <ToggleRight className="w-4 h-4 text-success" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-destructive" />
                            )}
                          </Button>

                          {/* Reset Password */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(salon.id)}
                            className="h-8 w-8 p-0"
                            disabled={resetPasswordMutation.isPending}
                            title="Réinitialiser le mot de passe"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSalon(salon.id, salon.name)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled={deleteSalonMutation.isPending}
                            title="Supprimer le salon"
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
              <p className="text-muted-foreground">
                {salons.length === 0 ? "Aucun salon enregistré" : "Aucun salon ne correspond à votre recherche"}
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
