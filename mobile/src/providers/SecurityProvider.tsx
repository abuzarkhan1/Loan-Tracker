import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

export type AutoLockOption = "immediate" | "1m" | "5m" | "15m";

type SecuritySettings = {
  appLockEnabled: boolean;
  biometricEnabled: boolean;
  autoLockAfter: AutoLockOption;
  pinSalt?: string;
  pinHash?: string;
};

type SecurityContextValue = {
  settings: SecuritySettings;
  isBootstrapping: boolean;
  isLocked: boolean;
  wrongAttempts: number;
  lockedUntil: number | null;
  hasPin: boolean;
  biometricAvailable: boolean;
  saveSettings: (settings: Partial<SecuritySettings>) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  lockNow: () => void;
  resetPin: () => Promise<void>;
  recordActivity: () => void;
};

const SETTINGS_KEY = "loan-tracker-security-settings";

const defaultSettings: SecuritySettings = {
  appLockEnabled: false,
  biometricEnabled: false,
  autoLockAfter: "1m",
};

const autoLockMs: Record<AutoLockOption, number> = {
  immediate: 0,
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
};

const SecurityContext = createContext<SecurityContextValue | null>(null);

const readSettings = async () => {
  const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
  if (!stored) return defaultSettings;
  return { ...defaultSettings, ...JSON.parse(stored) } as SecuritySettings;
};

const writeSettings = async (settings: SecuritySettings) => {
  await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
};

const createSalt = async () => {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const hashPin = async (pin: string, salt: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);

export const SecurityProvider = ({ children }: PropsWithChildren) => {
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [lastActivityAt, setLastActivityAt] = useState(Date.now());
  const [backgroundAt, setBackgroundAt] = useState<number | null>(null);

  const hasPin = Boolean(settings.pinHash && settings.pinSalt);

  useEffect(() => {
    const bootstrap = async () => {
      const [nextSettings, hasHardware, enrolled] = await Promise.all([
        readSettings(),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      setSettings(nextSettings);
      setBiometricAvailable(hasHardware && enrolled);
      setIsLocked(Boolean(nextSettings.appLockEnabled && nextSettings.pinHash));
      setIsBootstrapping(false);
    };

    void bootstrap();
  }, []);

  const persistSettings = useCallback(async (nextSettings: SecuritySettings) => {
    setSettings(nextSettings);
    await writeSettings(nextSettings);
  }, []);

  const lockNow = useCallback(() => {
    if (settings.appLockEnabled && hasPin) {
      setIsLocked(true);
    }
  }, [hasPin, settings.appLockEnabled]);

  const recordActivity = useCallback(() => {
    if (!isLocked) {
      setLastActivityAt(Date.now());
    }
  }, [isLocked]);

  useEffect(() => {
    if (!settings.appLockEnabled || !hasPin || isLocked || settings.autoLockAfter === "immediate") return;

    const lockDelay = autoLockMs[settings.autoLockAfter];
    const elapsed = Date.now() - lastActivityAt;
    const timeout = setTimeout(lockNow, Math.max(lockDelay - elapsed, 0));
    return () => clearTimeout(timeout);
  }, [hasPin, isLocked, lastActivityAt, lockNow, settings.appLockEnabled, settings.autoLockAfter]);

  useEffect(() => {
    const handleStateChange = (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        setBackgroundAt(Date.now());
        if (settings.autoLockAfter === "immediate") lockNow();
        return;
      }

      if (nextState === "active" && backgroundAt !== null) {
        const elapsed = Date.now() - backgroundAt;
        if (elapsed >= autoLockMs[settings.autoLockAfter]) lockNow();
        setBackgroundAt(null);
      }
    };

    const subscription = AppState.addEventListener("change", handleStateChange);
    return () => subscription.remove();
  }, [backgroundAt, lockNow, settings.autoLockAfter]);

  const value = useMemo<SecurityContextValue>(
    () => ({
      settings,
      isBootstrapping,
      isLocked,
      wrongAttempts,
      lockedUntil,
      hasPin,
      biometricAvailable,
      saveSettings: async (partial) => {
        const nextSettings = { ...settings, ...partial };
        if (!nextSettings.appLockEnabled) {
          setIsLocked(false);
        }
        await persistSettings(nextSettings);
      },
      setPin: async (pin) => {
        const pinSalt = await createSalt();
        const pinHash = await hashPin(pin, pinSalt);
        const nextSettings = {
          ...settings,
          appLockEnabled: true,
          pinSalt,
          pinHash,
        };
        setWrongAttempts(0);
        setLockedUntil(null);
        setIsLocked(false);
        await persistSettings(nextSettings);
      },
      verifyPin: async (pin) => {
        if (lockedUntil && Date.now() < lockedUntil) return false;
        if (!settings.pinSalt || !settings.pinHash) return false;

        const nextHash = await hashPin(pin, settings.pinSalt);
        const valid = nextHash === settings.pinHash;

        if (valid) {
          setWrongAttempts(0);
          setLockedUntil(null);
          setIsLocked(false);
          setLastActivityAt(Date.now());
          return true;
        }

        const nextAttempts = wrongAttempts + 1;
        setWrongAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          setLockedUntil(Date.now() + 30_000);
        }
        return false;
      },
      unlockWithBiometric: async () => {
        if (!settings.biometricEnabled || !biometricAvailable) return false;
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock Loan Tracker",
          fallbackLabel: "Use PIN",
        });
        if (result.success) {
          setWrongAttempts(0);
          setLockedUntil(null);
          setIsLocked(false);
          setLastActivityAt(Date.now());
          return true;
        }
        return false;
      },
      lockNow,
      resetPin: async () => {
        const nextSettings = {
          ...settings,
          appLockEnabled: false,
          biometricEnabled: false,
          pinSalt: undefined,
          pinHash: undefined,
        };
        setWrongAttempts(0);
        setLockedUntil(null);
        setIsLocked(false);
        await persistSettings(nextSettings);
      },
      recordActivity,
    }),
    [
      biometricAvailable,
      hasPin,
      isBootstrapping,
      isLocked,
      lockNow,
      lockedUntil,
      persistSettings,
      recordActivity,
      settings,
      wrongAttempts,
    ],
  );

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity must be used within SecurityProvider");
  }

  return context;
};
