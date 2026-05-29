import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import { useAppTheme } from "./ThemeProvider";
import { fontFamily } from "../utils/theme";

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

export type CustomAlertOptions = {
  title: string;
  message: string;
  buttons?: AlertButton[];
};

type AlertContextValue = {
  showAlert: (options: CustomAlertOptions) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

// Global static reference for non-component files (like services/utilities)
type GlobalAlertRef = {
  show: (options: CustomAlertOptions) => void;
};

export const globalAlert = {
  current: null as GlobalAlertRef | null,
};

export const showAlert = (options: CustomAlertOptions) => {
  if (globalAlert.current) {
    globalAlert.current.show(options);
  } else {
    // Fallback to standard react-native Alert if provider not mounted yet
    const { Alert } = require("react-native");
    Alert.alert(
      options.title,
      options.message,
      options.buttons?.map(btn => ({
        text: btn.text,
        onPress: btn.onPress,
        style: btn.style,
      }))
    );
  }
};

export const AlertProvider = ({ children }: PropsWithChildren) => {
  const { theme } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<CustomAlertOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const show = (newOptions: CustomAlertOptions) => {
    setOptions(newOptions);
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hide = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setOptions(null);
    });
  };

  useEffect(() => {
    globalAlert.current = { show };
    return () => {
      globalAlert.current = null;
    };
  }, []);

  const handleButtonPress = (btn: AlertButton) => {
    hide();
    if (btn.onPress) {
      // Delay slightly to allow modal to close smoothly
      setTimeout(() => {
        btn.onPress?.();
      }, 100);
    }
  };

  const alertButtons = options?.buttons && options.buttons.length > 0 
    ? options.buttons 
    : [{ text: "Theek Hai", style: "default" as const }];

  return (
    <AlertContext.Provider value={{ showAlert: show }}>
      {children}
      {visible && options ? (
        <Modal
          transparent
          visible={visible}
          animationType="none"
          onRequestClose={hide}
        >
          <View style={styles.overlay}>
            <Animated.View 
              style={[
                styles.backdrop, 
                { opacity: fadeAnim }
              ]} 
              onTouchStart={hide}
            />
            <Animated.View 
              style={[
                styles.card, 
                { 
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.92, 1],
                      })
                    }
                  ],
                  opacity: fadeAnim
                }
              ]}
            >
              <Text style={[styles.title, { color: theme.text }]}>
                {options.title}
              </Text>
              <Text style={[styles.message, { color: theme.muted }]}>
                {options.message}
              </Text>
              
              <View style={[
                styles.buttonContainer, 
                alertButtons.length > 2 ? styles.buttonContainerVertical : styles.buttonContainerHorizontal
              ]}>
                {alertButtons.map((btn, idx) => {
                  const isCancel = btn.style === "cancel";
                  const isDestructive = btn.style === "destructive";
                  
                  let btnBg = theme.primary;
                  let textColor = theme.white;
                  let borderStyle = {};
                  
                  if (isCancel) {
                    btnBg = "transparent";
                    textColor = theme.muted;
                    borderStyle = { borderWidth: 1, borderColor: theme.border };
                  } else if (isDestructive) {
                    btnBg = theme.danger;
                    textColor = theme.white;
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.85}
                      onPress={() => handleButtonPress(btn)}
                      style={[
                        styles.button,
                        { backgroundColor: btnBg, ...borderStyle },
                        alertButtons.length > 2 ? styles.buttonVertical : styles.buttonHorizontal
                      ]}
                    >
                      <Text style={[
                        styles.buttonText, 
                        { color: textColor }
                      ]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </AlertContext.Provider>
  );
};

export const useCustomAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useCustomAlert must be used within AlertProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26, 22, 31, 0.55)",
  },
  card: {
    width: "82%",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#583020",
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  title: {
    fontFamily: fontFamily.extraBold,
    fontSize: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 10,
  },
  buttonContainerHorizontal: {
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonContainerVertical: {
    flexDirection: "column",
  },
  button: {
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  buttonHorizontal: {
    flex: 1,
  },
  buttonVertical: {
    width: "100%",
  },
  buttonText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
  },
});
