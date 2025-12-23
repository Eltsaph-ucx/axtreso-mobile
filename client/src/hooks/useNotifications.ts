import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useNotifications() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Les notifications ne sont pas supportées sur ce navigateur');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast.success('Notifications activées');
        // Send test notification
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: 'AXTRESO',
            options: {
              body: 'Notifications activées avec succès',
              icon: '/icon-192x192.png',
            },
          });
        }
      }

      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Erreur lors de l\'activation des notifications');
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || notificationPermission !== 'granted') {
      console.warn('Notifications not permitted');
      return;
    }

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options: {
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          ...options,
        },
      });
    }
  };

  return {
    isSupported,
    notificationPermission,
    requestPermission,
    sendNotification,
  };
}
