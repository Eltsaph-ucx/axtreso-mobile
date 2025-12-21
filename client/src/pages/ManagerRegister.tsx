import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ManagerRegister() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    salonName: "",
    city: "Libreville" as "Libreville" | "Brazzaville",
    phone: "",
  });

  const registerMutation = trpc.auth.registerManager.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCityChange = (value: string) => {
    setFormData(prev => ({ ...prev, city: value as "Libreville" | "Brazzaville" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password || !formData.salonName) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        salonName: formData.salonName,
        city: formData.city,
        phone: formData.phone || undefined,
      });

      toast.success("Compte créé avec succès! Redirection...");
      setTimeout(() => setLocation("/manager/login"), 1500);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">A</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">AXTRESO</h1>
          <p className="text-muted-foreground">Créer un compte gérant</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-6">
          {/* Salon Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Nom du Salon *
            </label>
            <Input
              type="text"
              name="salonName"
              value={formData.salonName}
              onChange={handleChange}
              placeholder="Ex: Salon de Coiffure Élégance"
              className="w-full"
              required
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Ville *
            </label>
            <Select value={formData.city} onValueChange={handleCityChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Libreville">Libreville</SelectItem>
                <SelectItem value="Brazzaville">Brazzaville</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Téléphone
            </label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ex: +241 06 12 34 56"
              className="w-full"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Email *
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              className="w-full"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Mot de Passe *
            </label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Au moins 8 caractères"
              className="w-full"
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 caractères, incluant majuscules, minuscules et chiffres
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Confirmer le Mot de Passe *
            </label>
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmer votre mot de passe"
              className="w-full"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer mon Compte"
            )}
          </Button>

          {/* Login Link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Vous avez déjà un compte? </span>
            <button
              type="button"
              onClick={() => setLocation("/manager/login")}
              className="text-secondary hover:text-secondary/80 font-medium"
            >
              Se connecter
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-secondary/10 border border-secondary/20 rounded-lg p-4 text-sm text-foreground">
          <p className="font-medium mb-2">✓ Données sécurisées</p>
          <p className="text-muted-foreground">
            Vos données sont chiffrées et synchronisées automatiquement en temps réel.
          </p>
        </div>
      </div>
    </div>
  );
}
