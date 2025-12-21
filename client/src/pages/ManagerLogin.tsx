import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ManagerLogin() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = trpc.auth.loginManager.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await loginMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
      });

      toast.success("Connexion réussie! Redirection...");
      setTimeout(() => setLocation("/manager/dashboard"), 1500);
    } catch (error: any) {
      toast.error(error.message || "Identifiants invalides");
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
          <p className="text-muted-foreground">Connexion Gérant</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-6">
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
            />
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
              placeholder="Votre mot de passe"
              className="w-full"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se Connecter"
            )}
          </Button>

          {/* Register Link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Vous n'avez pas de compte? </span>
            <button
              type="button"
              onClick={() => setLocation("/manager/register")}
              className="text-secondary hover:text-secondary/80 font-medium"
            >
              S'inscrire
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-secondary/10 border border-secondary/20 rounded-lg p-4 text-sm text-foreground">
          <p className="font-medium mb-2">💡 Besoin d'aide?</p>
          <p className="text-muted-foreground">
            Si vous avez oublié votre mot de passe, contactez votre administrateur.
          </p>
        </div>
      </div>
    </div>
  );
}
