/**
 * FAST - Toast Component
 * Snackbar no topo da tela com animação suave e haptic
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
  visible: boolean;
  variant: ToastVariant;
  message: string;
  duration?: number;
  onHide?: () => void;
}

const getVariantStyles = (variant: ToastVariant) => {
  switch (variant) {
    case "success":
      return {
        icon: "checkmark-circle",
        bgColor: Colors.success || "#4CAF50",
        textColor: "#FFFFFF",
      };
    case "error":
      return {
        icon: "close-circle",
        bgColor: Colors.error || "#F44336",
        textColor: "#FFFFFF",
      };
    case "warning":
      return {
        icon: "warning",
        bgColor: Colors.warning || "#FF9800",
        textColor: "#FFFFFF",
      };
    case "info":
      return {
        icon: "information-circle",
        bgColor: Colors.primary || "#2196F3",
        textColor: "#FFFFFF",
      };
  }
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  variant,
  message,
  duration = 3000,
  onHide,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback suave
      if (variant === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (variant === "error") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Animação de entrada
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto隐藏
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  if (!visible) return null;

  const variantStyles = getVariantStyles(variant);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + Spacing.sm,
          backgroundColor: variantStyles.bgColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={variantStyles.icon as any}
          size={22}
          color={variantStyles.textColor}
        />
        <Text style={[styles.message, { color: variantStyles.textColor }]}>
          {message}
        </Text>
      </View>
      <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={variantStyles.textColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  message: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
