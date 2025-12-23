import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { Bell, Save, ArrowLeft } from "lucide-react";

export default function ManagerSettings() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { notificationPermission, requestPermission, isSupported } = useNotifications();
  const [salonId, setSalonId] = useState<number | null>(null);
  const [settings, setSettings] = useState({
    dailyReminder: true,
    inactivityAlert: true,
    reportNotification: true,
  });

  // Get user's salon
  const { data: salon } = trpc.salon.getMysalon.useQuery(undefined, {
    enabled: !!user && user.role === "manager",
  });

  const salons = salon ? [salon] : [];

  // Get notification settings
  const { data: notificationSettings } = trpc.notification.getSettings.useQuery(salonId || 0, {
    enabled: !!salonId,
  });

  const updateSettingsMutation = trpc.notification.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Paramètres mis à jour");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "manager")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (salon && !salonId) {
      setSalonId(salon.id);
    }
  }, [salon, salonId]);

  useEffect(() => {
    if (notificationSettings) {
      setSettings({
        dailyReminder: notificationSettings.dailyReminder ?? true,
        inactivityAlert: notificationSettings.inactivityAlert ?? true,
        reportNotification: notificationSettings.reportNotification ?? true,
      });
    }
  }, [notificationSettings]);

  const handleSave = () => {
    if (!salonId) return;

    updateSettingsMutation.mutate({
      salonId,
      ...settings,
    });
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
    <DashboardLayout title="Paramètres" description="Gérez vos préférences et notifications">
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/manager/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {/* Notifications Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
          </div>

          {/* Browser Notification Permission */}
          {isSupported && (
            <div className="mb-6 p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Notifications du Navigateur</p>
                  <p className="text-sm text-muted-foreground">
                    {notificationPermission === "granted"
                      ? "Notifications activées"
                      : notificationPermission === "denied"
                      ? "Notifications refusées"
                      : "Cliquez pour activer"}
                  </p>
                </div>
                {notificationPermission !== "granted" && (
                  <Button
                    onClick={requestPermission}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    Activer
                  </Button>
                )}
                {notificationPermission === "granted" && (
                  <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                    Actif
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notification Settings */}
          <div className="space-y-4">
            {/* Daily Reminder */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Rappel Quotidien</p>
                <p className="text-sm text-muted-foreground">
                  Recevez un rappel chaque jour pour saisir vos transactions
                </p>
              </div>
              <Switch
                checked={settings.dailyReminder}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, dailyReminder: checked })
                }
              />
            </div>

            {/* Inactivity Alert */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Alerte Inactivité</p>
                <p className="text-sm text-muted-foreground">
                  Soyez alerté après 2 jours sans transaction
                </p>
              </div>
              <Switch
                checked={settings.inactivityAlert}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, inactivityAlert: checked })
                }
              />
            </div>

            {/* Report Notification */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Notification Rapports</p>
                <p className="text-sm text-muted-foreground">
                  Soyez notifié quand un nouveau rapport est généré
                </p>
              </div>
              <Switch
                checked={settings.reportNotification}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, reportNotification: checked })
                }
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex gap-4">
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </Card>

        {/* App Installation */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Application Mobile</h3>
          <p className="text-muted-foreground mb-4">
            AXTRESO peut être installée comme application mobile sur votre téléphone pour un accès rapide et un fonctionnement hors ligne.
          </p>
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Pour iOS :</strong> Appuyez sur le bouton de partage et sélectionnez "Sur l'écran d'accueil"
            </p>
            <p className="text-sm text-foreground mt-2">
              <strong>Pour Android :</strong> Appuyez sur le menu (⋮) et sélectionnez "Installer l'application"
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
