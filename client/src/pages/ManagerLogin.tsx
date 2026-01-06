import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useManagerAuth } from '@/hooks/useManagerAuth';

export default function ManagerLogin() {
  const [, setLocation] = useLocation();
  const { login } = useManagerAuth();

  useEffect(() => {
    // Check if auth parameter is in URL
    const params = new URLSearchParams(window.location.search);
    const authData = params.get('auth');

    if (authData) {
      try {
        // Decode the auth data
        const decoded = JSON.parse(Buffer.from(authData, 'base64').toString());
        
        // Store in localStorage
        localStorage.setItem('axtreso_manager_auth', JSON.stringify(decoded));
        
        // Call login hook to update state
        login(decoded.userId, decoded.email);
        
        // Redirect to dashboard
        setLocation('/manager/dashboard');
      } catch (error) {
        console.error('Failed to decode auth data:', error);
        // Fallback to login form
        window.location.href = '/manager-login-form.html';
      }
    } else {
      // Redirect to the static HTML login page
      window.location.href = '/manager-login-form.html';
    }
  }, [login, setLocation]);

  return null; // Redirect happens in useEffect
}
