import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ManagerRegister() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    salonName: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "Libreville",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCityChange = (value: string) => {
    setFormData(prev => ({ ...prev, city: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.salonName || !formData.email || !formData.password || !formData.city) {
      toast.error("Veuillez remplir tous les champs");
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

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/manager/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salonName: formData.salonName,
          email: formData.email,
          password: formData.password,
          city: formData.city,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Une erreur s'est produite");
        return;
      }

      toast.success(data.message || "Inscription réussie! Redirection vers la connexion...");
      setTimeout(() => setLocation("/manager/login"), 2000);
    } catch (error: any) {
      toast.error(error.message || "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
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
          <p className="text-muted-foreground">Inscription Gérant</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-4">
          {/* Salon Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Nom du Salon
            </label>
            <Input
              type="text"
              name="salonName"
              value={formData.salonName}
              onChange={handleChange}
              placeholder="Mon Salon de Coiffure"
              className="w-full"
              required
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              className="w-full"
              required
              disabled={isLoading}
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Ville
            </label>
            <Select value={formData.city} onValueChange={handleCityChange} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez votre ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Libreville">Libreville</SelectItem>
                <SelectItem value="Brazzaville">Brazzaville</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Mot de Passe
            </label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Au moins 8 caractères"
              className="w-full"
              required
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Confirmer le Mot de Passe
            </label>
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmez votre mot de passe"
              className="w-full"
              required
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-6"
            size="lg"
          >
            {isLoading ? (
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
              disabled={isLoading}
            >
              Se Connecter
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-secondary/10 border border-secondary/20 rounded-lg p-4 text-sm text-foreground">
          <p className="font-medium mb-2">🔒 Sécurité</p>
          <p className="text-muted-foreground">
            Vos données sont chiffrées et sécurisées. Nous ne partageons jamais vos informations.
          </p>
        </div>
      </div>
    </div>
  );
}
