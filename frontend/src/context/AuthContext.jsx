import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/endpoints.js";
import { getToken, setToken, setUnauthorizedHandler } from "../services/api.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const loadUser = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      setUser(res.data.data.user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (identifier, password) => {
    const res = await authApi.login({ identifier, password });
    const { token, user: u } = res.data.data;
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    const { token, user: u } = res.data.data;
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      role: user?.role || null,
      login,
      register,
      logout,
      reload: loadUser,
      setUser,
    }),
    [user, loading, login, register, logout, loadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
