import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { DiscordGuild, DiscordUser } from '../types';
import { fetchAuthMe, logout as apiLogout } from './api';

interface AuthContextType {
  user: DiscordUser | null;
  guilds: DiscordGuild[];
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  guilds: [],
  loading: true,
  refreshAuth: async () => {},
  logout: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DiscordUser | null>(() => {
    try {
      const stored = localStorage.getItem('mavely_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [guilds, setGuilds] = useState<DiscordGuild[]>(() => {
    try {
      const stored = localStorage.getItem('mavely_known_guilds');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('mavely_user');
    } catch {
      return true;
    }
  });

  const refreshAuth = useCallback(async () => {
    try {
      const data = await fetchAuthMe();
      if (data && data.user) {
        setUser(data.user);
        if (data.guilds && Array.isArray(data.guilds)) {
          setGuilds(data.guilds);
          try { localStorage.setItem('mavely_known_guilds', JSON.stringify(data.guilds)); } catch {}
        }
        try { localStorage.setItem('mavely_user', JSON.stringify(data.user)); } catch {}
      } else {
        const cached = localStorage.getItem('mavely_user');
        if (cached) {
          try { setUser(JSON.parse(cached)); } catch {}
        }
      }
    } catch {
      const cached = localStorage.getItem('mavely_user');
      if (cached) {
        try { setUser(JSON.parse(cached)); } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {}
    try { localStorage.removeItem('mavely_user'); } catch {}
    setUser(null);
    setGuilds([]);
    window.location.assign('/');
  };

  return (
    <AuthContext.Provider value={{ user, guilds, loading, refreshAuth, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
