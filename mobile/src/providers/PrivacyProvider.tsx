import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { PrivacySettings } from "../api/types";
import { useAuth } from "./AuthProvider";

const PRIVACY_KEY = "loan-tracker-privacy-settings";
const SCREEN_CAPTURE_KEY = "loan-tracker-privacy-mode";

type PrivacyContextValue = {
  settings: PrivacySettings;
  amountsHidden: boolean;
  setAmountsHidden: (hidden: boolean) => Promise<void>;
  updateSettings: (payload: Partial<PrivacySettings>) => Promise<void>;
  toggleAmountsHidden: () => Promise<void>;
};

const defaults: PrivacySettings = {
  privacyModeEnabled: false,
  hideAmountsByDefault: false,
  requireUnlockToReveal: false,
  blurInAppSwitcher: false,
  scope: "EVERYWHERE",
  smartEntryEnabled: true,
  voiceEntryEnabled: true,
  saveSmartEntryHistory: true,
  saveVoiceTranscriptHistory: false,
  smartEntryLanguagePreference: "MIXED",
};

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export const PrivacyProvider = ({ children }: PropsWithChildren) => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(defaults);
  const [amountsHidden, setAmountsHiddenState] = useState(false);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(PRIVACY_KEY);
      if (stored) {
        const parsed = { ...defaults, ...JSON.parse(stored) };
        setSettings(parsed);
        setAmountsHiddenState(Boolean(parsed.privacyModeEnabled && parsed.hideAmountsByDefault));
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!token) return;
    const sync = async () => {
      try {
        const remote = await api.getPrivacySettings();
        setSettings({ ...defaults, ...remote });
        setAmountsHiddenState(Boolean(remote.privacyModeEnabled && remote.hideAmountsByDefault));
        await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(remote));
      } catch {
        // Local privacy settings continue to work offline.
      }
    };
    void sync();
  }, [token]);

  useEffect(() => {
    const applyScreenPrivacy = async () => {
      try {
        const enabled = settings.privacyModeEnabled && settings.blurInAppSwitcher;
        if (enabled) {
          await ScreenCapture.preventScreenCaptureAsync(SCREEN_CAPTURE_KEY);
          await ScreenCapture.enableAppSwitcherProtectionAsync(0.82);
        } else {
          await ScreenCapture.allowScreenCaptureAsync(SCREEN_CAPTURE_KEY);
          await ScreenCapture.disableAppSwitcherProtectionAsync();
        }
      } catch {
        // Screen privacy support varies by device/platform; amount masking remains active.
      }
    };
    void applyScreenPrivacy();
  }, [settings.blurInAppSwitcher, settings.privacyModeEnabled]);

  const setAmountsHidden = async (hidden: boolean) => {
    setAmountsHiddenState(hidden);
  };

  const updateSettings = async (payload: Partial<PrivacySettings>) => {
    const next = { ...settings, ...payload };
    setSettings(next);
    setAmountsHiddenState(Boolean(next.privacyModeEnabled && next.hideAmountsByDefault));
    await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(next));
    if (token) {
      try {
        const remote = await api.updatePrivacySettings(payload);
        setSettings({ ...defaults, ...remote });
        await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(remote));
      } catch {
        // Keep local setting if sync fails.
      }
    }
  };

  const toggleAmountsHidden = async () => {
    const nextHidden = !amountsHidden;
    if (!nextHidden && settings.requireUnlockToReveal) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Reveal hidden amounts",
        fallbackLabel: "Use device passcode",
      });
      if (!result.success) return;
    }
    if (nextHidden && !settings.privacyModeEnabled) {
      const next = { ...settings, privacyModeEnabled: true };
      setSettings(next);
      await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(next));
      if (token) {
        try {
          const remote = await api.updatePrivacySettings({ privacyModeEnabled: true });
          setSettings({ ...defaults, ...remote });
          await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(remote));
        } catch {
          // Quick privacy toggle remains local if sync fails.
        }
      }
    }
    setAmountsHiddenState(nextHidden);
  };

  const value = useMemo<PrivacyContextValue>(
    () => ({
      settings,
      amountsHidden,
      setAmountsHidden,
      updateSettings,
      toggleAmountsHidden,
    }),
    [amountsHidden, settings, token],
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) throw new Error("usePrivacy must be used within PrivacyProvider");
  return context;
};
