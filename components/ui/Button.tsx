/**
 * FAST - Componente Button
 * Botão preto full-width usando React Native Paper
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Button as PaperButton } from "react-native-paper";

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: "contained" | "outlined" | "text";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  mode = "contained",
  disabled = false,
  loading = false,
  style,
  icon,
}) => {
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      icon={icon}
      style={[
        styles.button,
        mode === "contained" && styles.contained,
        mode === "outlined" && styles.outlined,
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      labelStyle={[
        styles.label,
        mode === "contained" && styles.labelContained,
        mode === "outlined" && styles.labelOutlined,
        disabled && styles.labelDisabled,
      ]}
      buttonColor={mode === "contained" ? Colors.primary : "transparent"}
      textColor={mode === "contained" ? Colors.white : Colors.primary}
    >
      {title.toUpperCase()}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingVertical: Spacing.xs,
    borderRadius: 0,
    minHeight: 52,
  },
  contained: {
    backgroundColor: Colors.primary,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  disabled: {
    backgroundColor: Colors.lightGray,
  },
  label: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  labelContained: {
    color: Colors.white,
  },
  labelOutlined: {
    color: Colors.primary,
  },
  labelDisabled: {
    color: Colors.secondary,
  },
});
