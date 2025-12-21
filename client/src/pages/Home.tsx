import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { BarChart3, Users, TrendingUp, Lock } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        setLocation("/admin/dashboard");
      } else if (user.role === "manager") {
        setLocation("/manager/dashboard");
      }
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-background to-secondary/20 flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-secondary border-t-primary rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-background to-secondary/20">
      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            <span className="text-xl font-bold text-primary">AXTRESO</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              variant="outline"
              className="hidden sm:inline-flex"
            >
              Admin
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-primary leading-tight">
                Gérez votre trésorerie
                <span className="text-secondary"> simplement</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                AXTRESO est la solution complète de gestion financière pour les salons de coiffure à Libreville et Brazzaville.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setLocation("/manager/register")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Créer un compte Gérant
              </Button>
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                size="lg"
                variant="outline"
              >
                Accès Administrateur
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>Données sécurisées et synchronisées en temps réel</span>
            </div>
          </div>

          {/* Right Features */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Suivi en Temps Réel</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualisez vos encaissements et décaissements au jour le jour
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Rapports Intelligents</h3>
                  <p className="text-sm text-muted-foreground">
                    Générez des rapports détaillés avec analyses et conseils personnalisés
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Gestion Multi-Salons</h3>
                  <p className="text-sm text-muted-foreground">
                    Administrez plusieurs salons depuis une seule interface
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-card border-t border-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Fonctionnalités Principales</h2>
            <p className="text-lg text-muted-foreground">Tout ce dont vous avez besoin pour gérer votre trésorerie</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Dashboard Intuitif",
                description: "Visualisez votre solde jour, mois et l'évolution sur 10 jours en un coup d'œil",
              },
              {
                title: "Transactions Flexibles",
                description: "Ajoutez, modifiez ou supprimez vos encaissements et décaissements facilement",
              },
              {
                title: "Historique Complet",
                description: "Accédez à l'historique de vos transactions avec filtres avancés et recherche",
              },
              {
                title: "Rapports Détaillés",
                description: "Générez des rapports professionnels avec graphiques et interprétations IA",
              },
              {
                title: "Exports Multi-Formats",
                description: "Exportez vos rapports en PDF, Excel ou Word pour partager facilement",
              },
              {
                title: "Mode Hors Ligne",
                description: "Accédez à votre application même sans connexion internet",
              },
            ].map((feature, index) => (
              <div key={index} className="bg-background border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-primary-foreground">Prêt à Démarrer?</h2>
            <p className="text-lg text-primary-foreground/90">
              Créez votre compte gratuitement et commencez à gérer votre trésorerie dès aujourd'hui
            </p>
          </div>
          <Button
            onClick={() => setLocation("/manager/register")}
            size="lg"
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            Créer un Compte Gérant
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 AXTRESO. Tous droits réservés. | Gestion de trésorerie pour salons de coiffure</p>
        </div>
      </footer>
    </div>
  );
}
