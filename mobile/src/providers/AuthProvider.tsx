import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../api/client";
import { User } from "../api/types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isBootstrapping: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  updateProfile: (payload: { name?: string; email?: string }) => Promise<User>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = "loan-tracker-token";
const USER_KEY = "loan-tracker-user";

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const persistSession = async (nextToken: string, nextUser: User) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, nextToken],
      [USER_KEY, JSON.stringify(nextUser)],
    ]);
  };

  const clearSession = async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);

        if (!storedToken) return;

        setAuthToken(storedToken);
        setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));

        const freshUser = await api.me();
        setUser(freshUser);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      } catch {
        await clearSession();
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isBootstrapping,
      login: async (payload) => {
        const session = await api.login(payload);
        await persistSession(session.token, session.user);
      },
      register: async (payload) => {
        const session = await api.register(payload);
        await persistSession(session.token, session.user);
      },
      updateProfile: async (payload) => {
        const nextUser = await api.updateMe(payload);
        setUser(nextUser);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        return nextUser;
      },
      logout: clearSession,
    }),
    [user, token, isBootstrapping],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
