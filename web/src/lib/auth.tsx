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
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await fetchAuthMe();
      setUser(data.user);
      setGuilds(data.guilds || []);
    } catch {
      setUser(null);
      setGuilds([]);
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
    } catch {
      // Ignore network errors during logout
    }
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
