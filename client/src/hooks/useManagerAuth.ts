import { useState, useEffect } from 'react';

export interface ManagerAuthState {
  userId: number | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = 'axtreso_manager_auth';

export function useManagerAuth() {
  const [state, setState] = useState<ManagerAuthState>({
    userId: null,
    email: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check authentication on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const auth = JSON.parse(stored);
        setState({
          userId: auth.userId,
          email: auth.email,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (userId: number, email: string) => {
    const auth = { userId, email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    setState({
      userId,
      email,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      userId: null,
      email: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return { ...state, login, logout };
}
