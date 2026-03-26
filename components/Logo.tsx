/**
 * FAST - Logo Component
 * Componente de logótipo para as telas
 */

import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface LogoProps {
  variant?: "white" | "black";
  size?: "small" | "medium" | "large";
}

export const Logo: React.FC<LogoProps> = ({
  variant = "black",
  size = "medium",
}) => {
  const sizeStyles = {
    small: { width: 80, height: 30 },
    medium: { width: 120, height: 45 },
    large: { width: 160, height: 60 },
  };

  const source =
    variant === "white"
      ? require("@/assets/images/fast-logo-white.png")
      : require("@/assets/images/fast-logo.png");

  return (
    <View style={[styles.container, sizeStyles[size]]}>
      <Image source={source} style={styles.image} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
