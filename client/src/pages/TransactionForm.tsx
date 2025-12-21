import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const ENCAISSEMENT_TYPES = [
  "Pose perruque",
  "Tissage",
  "Coiffure",
  "Maquillage",
  "Manucure",
  "Vente produits",
  "Autre",
];

const DECAISSEMENT_TYPES = [
  "Achat produits",
  "Salaires",
  "Loyer",
  "Électricité",
  "Eau",
  "Transport",
  "Maintenance",
  "Autre",
];

export default function TransactionForm() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/manager/transactions/:id/edit");
  const isEdit = !!match;
  const transactionId = params?.id ? parseInt(params.id) : null;
  const [salonId, setSalonId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    type: "encaissement" as "encaissement" | "decaissement",
    designation: "",
    amount: "",
    comment: "",
    date: new Date().toISOString().split("T")[0],
  });

  const { data: salon } = trpc.salon.getMysalon.useQuery(undefined, {
    enabled: !!user && user.role === "manager",
  });

  const { data: transactions = [] } = trpc.transaction.getBySalon.useQuery(
    { salonId: salonId || 0 },
    { enabled: !!salonId && isEdit }
  );

  const createMutation = trpc.transaction.create.useMutation({
    onSuccess: () => {
      toast.success("Transaction créée avec succès");
      setLocation("/manager/transactions");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.transaction.update.useMutation({
    onSuccess: () => {
      toast.success("Transaction modifiée avec succès");
      setLocation("/manager/transactions");
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

  useEffect(() => {
    if (isEdit && transactions.length > 0 && transactionId) {
      const trans = transactions.find(t => t.id === transactionId);
      if (trans) {
        setFormData({
          type: trans.type,
          designation: trans.designation,
          amount: trans.amount,
          comment: trans.comment || "",
          date: new Date(trans.date).toISOString().split("T")[0],
        });
      }
    }
  }, [isEdit, transactions, transactionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: "encaissement" | "decaissement") => {
    setFormData(prev => ({ ...prev, type: value, designation: "" }));
  };

  const handleDesignationChange = (value: string) => {
    setFormData(prev => ({ ...prev, designation: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.designation || !formData.amount || !salonId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (isEdit && transactionId) {
      updateMutation.mutate({
        transactionId,
        salonId,
        designation: formData.designation,
        amount: parseFloat(formData.amount),
        comment: formData.comment,
        date: new Date(formData.date),
      });
    } else {
      createMutation.mutate({
        salonId,
        type: formData.type,
        designation: formData.designation,
        amount: parseFloat(formData.amount),
        comment: formData.comment,
        date: new Date(formData.date),
      });
    }
  };

  const designationOptions = formData.type === "encaissement" ? ENCAISSEMENT_TYPES : DECAISSEMENT_TYPES;

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
    <DashboardLayout
      title={isEdit ? "Modifier Transaction" : "Nouvelle Transaction"}
      description={isEdit ? "Modifiez les détails de la transaction" : "Enregistrez une nouvelle transaction"}
    >
      <div className="max-w-2xl">
        <Button
          variant="outline"
          onClick={() => setLocation("/manager/transactions")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type */}
            {!isEdit && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Type de Transaction *
                </label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => handleTypeChange("encaissement")}
                    className={formData.type === "encaissement" ? "flex-1 bg-success hover:bg-success/90 text-white" : "flex-1 bg-muted text-foreground hover:bg-muted/80"}
                  >
                    Encaissement
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleTypeChange("decaissement")}
                    className={formData.type === "decaissement" ? "flex-1 bg-destructive hover:bg-destructive/90 text-white" : "flex-1 bg-muted text-foreground hover:bg-muted/80"}
                  >
                    Décaissement
                  </Button>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Date *
              </label>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Désignation *
              </label>
              <Select value={formData.designation} onValueChange={handleDesignationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une désignation" />
                </SelectTrigger>
                <SelectContent>
                  {designationOptions.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Montant (FCFA) *
              </label>
              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0"
                step="100"
                min="0"
                required
              />
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Commentaire
              </label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                placeholder="Ajouter un commentaire (optionnel)"
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    En cours...
                  </>
                ) : (
                  isEdit ? "Modifier" : "Créer"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/manager/transactions")}
                size="lg"
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
